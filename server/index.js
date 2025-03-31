const express = require('express');
const app = express();
const http = require('http');
const socket = require('socket.io');
const Room = require('./class/room')
const Player = require('./class/player')
const server = http.createServer(app);
const { v4: uuidv4 } = require('uuid');
const { table } = require('console');

const PORT = 3000 || process.env.PORT;

const io = socket(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

const rooms = {}
let players = {}
const events = {
    joined: 'joined',
    start: 'start',
    update: 'update',
    reset: 'reset'
}
function createInitialMatrix() {
    return Array.from({ length: 10 }, (_, row) =>
        Array.from({ length: 10 }, (_, col) => {
            return {
                row,
                col,
                id: col + 1,  // Id baseado na posição inicial
                status: 'inactive',  // Nenhum rect, status inicial é 'inactive'
                rectId: null,       // Nenhum rect associado
                isHit: false,
                hasShip: false
            };
        })
    );
}

const initialRoom = {
    id: null,
    status: 'waiting',
    turnId: null,
    winnerId: null,
    players: [],
    player1: {
        id: null,
        name: "",
        connected: false,
        shipsPlaced: false,
        score: 0,
    },
    player2: {
        id: null,
        name: "",
        shipsPlaced: false,
        connected: false,
        score: 0,
    },
}

const initialPlayer = {
    id: null,
    connected: false,
    score: 0,
    name: '',
    ready: false,
    roomId: null,
    tableId: null
}

const initialTable = {
    id: null,
    playerId: null,
    grid: createInitialMatrix(),
    ships: [],
}

io.on('connection', (socket) => {

    console.log(socket)
    socket.on('create', ({ roomName, playerName }) => {

        const roomId = uuidv4();

        if (!rooms[roomId]) {
            rooms[roomId] = {
                ...initialRoom,
                id: roomId,
                roomName,
                players: [{
                    ...initialPlayer,
                    id: socket.id,
                    roomId
                }],
                player1: {
                    id: socket.id,
                    name: playerName,
                    score: 0,
                    connected: false,
                },
            }
            players[socket.id] = {
                id: socket.id,
                name: playerName,
                role: 'player1',
                table1: createInitialMatrix(),
                table2: createInitialMatrix(),
                playerRects: [],
                enemyRects: [],
                isReady: false,
                roomId: roomId
            }
        }
        socket.join(roomId)
        socket.emit('created', { room: rooms[roomId], player: players[socket.id], role: 'player1' })
    })
    socket.on('join', ({ roomCode, playerName }) => {

        const room = rooms[roomCode]

        if (!room) {
            socket.emit('join-error', { error: { message: "Sala não encontrada!" } })
            return
        }
        room.status = 'placing'
        room.player2 = {
            id: socket.id,
            name: playerName,
            score: 0,
            connected: false
        }
        players[socket.id] = {
            id: socket.id,
            name: playerName,
            role: 'player2',
            table1: createInitialMatrix(),
            table2: createInitialMatrix(),
            playerShips: [],
            enemyShips: [],
            isReady: false,
            roomId: room.id
        }

        socket.join(roomCode)

        socket.to(roomCode).emit('joined', { player: players[socket.id] });

        socket.emit('joined', { room, player: players[socket.id], opponent: players[room.player1.id], role: 'player2' });

        io.in(roomCode).emit('room-update', room);

    })


    socket.on('ready', ({ roomId }) => {
        const room = rooms[roomId]

        const role = getPlayerRole(roomId, socket.id)
        console.log(role)
        room[role].connected = true
        if (room && room.player1.connected && room.player2.connected) {
            io.in(room.id).emit('count', { time: 10 });
        }


    })
    socket.on('place-ships', (data) => {

        const player = players[socket.id];
        const room = rooms[player.roomId]

        if (!player) return;

        const newGrid = player.table1.map(row => row.map(cell => ({ ...cell })));
        const errors = [];

        data.forEach((ship) => {

            ship.positions.map(({ row, col }) => {
                if (row >= 10 || col >= 10) {
                    errors.push(`Ship ${ship.type} out of bounds`);
                    return;
                }

                // Check collisions
                if (newGrid[col][row].hasShip) {
                    errors.push(`Ship ${ship.type} collides at (${row},${col})`);
                    return;
                }
                newGrid[col][row] = {
                    ...newGrid[col][row],
                    rectId: ship.type,
                    hasShip: true
                };
            })
        });

        if (errors.length > 0) {
            socket.emit('placing-error', { errors });
            return;
        }

        player.table1 = newGrid;
        player.playerShips = data;
        room[player.role].shipsPlaced = true

        socket.emit('ships-placed', {
            success: true,
            grid: newGrid
        });

        if (room.player1.shipsPlaced && room.player2.shipsPlaced) {
            room.turnId = room.player1.id
            room.status = 'battling'
            io.in(room.id).emit('start')
        }
        io.in(room.id).emit('room-update', room, event = events.start);
        io.in(room.id).emit('turn-update',)
    })

    socket.on('attack', ({ positions }) => {
        const { col, row } = positions
        const player = players[socket.id]
        const room = rooms[player.roomId]
        const target = room.player1.id == player.id ? players[room.player2.id] : players[room.player1.id]
        const role = getPlayerRole(room.id, socket.id)


        //verify if is player turn
        if (room.turnId !== socket.id) {
            socket.emit('attacking-error', { message: `Turno de ${room.turnId}`, error: 'unauthorized' })
            return
        }

        if (row >= 10 || col >= 10 || target.table1[col][row].isHit) {
            socket.emit('attacking-error', { message: `Ataque invalido`, error: 'badrequest' })
            return
        }

        //update targer table
        target.table1[col][row].isHit = true
        //update attacker view table2
        player.table2[col][row].isHit = true
        if (target.table1[col][row].hasShip) {
            room[role].score++;
            const shipsCopy = [...target.playerShips]
            target.playerShips = checkSunkShip(shipsCopy, target.table1)
        }
        if (checkAllShipsIsSunk(target.playerShips)) {
            io.in(room.id).emit('winner', { winnerId: socket.id })
        }
        //update turn 
        room.turnId = room.turnId == room.player1.id ? room.player2.id : room.player1.id
        socket.emit('attack-update', player)
        io.to(target.id).emit('hit-update', target)
        io.in(room.id).emit('turn-update', { turnId: room.turnId })
        io.in(room.id).emit('room-update', room);
    })

    socket.on('restart', (request) => {



    })

    socket.on('disconnect', () => {
        //  onPlayerLeave(socket.id)
    })

    function getPlayerRole(roomId, id) {
        const room = rooms[roomId]
        if (!room) return
        return room.player1.id == id ? 'player1' : 'player2'
    }

    function checkSunkShip(ships, grid) {
        return ships.map((ship) => {
            const isSunk = ship.positions.every(pos => grid[pos.col][pos.row].isHit)
            return { ...ship, isSunk }
        })
    }
    function checkAllShipsIsSunk(ships) {
        return ships.every(ship => ship.isSunk)
    }
})


server.listen(PORT, () => console.log(`Server running on port ${PORT}`));