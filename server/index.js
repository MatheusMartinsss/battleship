const express = require('express');
require('dotenv').config()
const app = express();
const http = require('http');
const socket = require('socket.io');
const server = http.createServer(app);
const { v4: uuidv4 } = require('uuid');

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
        wantsRematch: false,
        score: 0,
    },
    player2: {
        id: null,
        name: "",
        shipsPlaced: false,
        connected: false,
        wantsRematch: false,
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
        socket.data.user = playerName
        socket.data.roomId = roomId
        socket.join(roomId)
        socket.emit('created', { room: rooms[roomId], player: players[socket.id], role: 'player1' })
    })
    socket.on('join', ({ roomCode, playerName }) => {

        const room = rooms[roomCode]

        if (!room) {
            socket.emit('join-error', { error: { message: "Sala não encontrada!" } })
            return
        }
        if (room.player1.id && room.player2.id) {
            socket.emit('join-error', { message: 'Sala cheia!', error: 'unauthorized' })
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
            player.table2[col][row].hasShip = true
            player.table2[col][row].rectId = target.table1[col][row].rectId
            target.playerShips = checkSunkShip(shipsCopy, target.table1)
        }
        //update turn 
        if (checkAllShipsIsSunk(target.playerShips)) {
            room.status = 'finished'
            room.winnerId = player.id
            io.in(room.id).emit('winner', player)

        } else {
            room.turnId = room.turnId == room.player1.id ? room.player2.id : room.player1.id
            io.in(room.id).emit('turn-update', { turnId: room.turnId })
            socket.emit('attack-update', player)
            io.to(target.id).emit('hit-update', target)

        }
        io.in(room.id).emit('room-update', room);
        updateGameDelta(room.id)
        //verify if have an winner
    })

    socket.on('play-again', () => {
        const player = players[socket.id]

        if (!player) return

        const room = rooms[player.roomId]

        if (!room) return

        const role = getPlayerRole(room.id, player.id)

        room[role].wantsRematch = true

        resetGame(room.id)


        if (room.player1.wantsRematch && room.player2.wantsRematch) {

            // Resetar o desejo de revanche
            room.player1.wantsRematch = false;
            room.player2.wantsRematch = false;

            updateGameDelta(room.id)
            io.in(room.id).emit('reset')
        }



    })

    socket.on('disconnect', () => {
        //  onPlayerLeave(socket.id)
    })

    function updateGameDelta(roomId) {
        const _room = io.sockets.adapter.rooms.get(roomId);
        if (!_room) return
        _room.forEach((socketId) => {

            const socket = io.sockets.sockets.get(socketId)

            if (socket) {
                const player = players[socketId]
                const opponentId = Array.from(_room).find((id => id !== socketId))
                if (opponentId) {
                    const opponent = players[opponentId]
                    socket.emit("game-update", {
                        player: player,
                        opponent,
                        room: rooms[roomId]
                    })
                }

            }
        })
    }

    function getUsersInRoom(roomId) {
        const room = io.sockets.adapter.rooms.get(roomId);
        if (!room) return []; // Sala não existe

        const users = [];
        for (const socketId of room) {
            const socket = io.sockets.sockets.get(socketId);
            if (socket && socket.data.user) {
                users.push(socket.data.user);
            }
        }
        return users;
    }

    function getPlayerRole(roomId, id) {
        const room = rooms[roomId]
        if (!room) return
        return room.player1.id == id ? 'player1' : 'player2'
    }
    function getPlayEnemy(roomId, id) {

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

    function resetGame(roomId) {
        const room = rooms[roomId];
        const player1 = players[room.player1.id];
        const player2 = players[room.player2.id];
        // Resetar o estado da sala
        room.status = 'placing';
        room.turnId = null;
        room.winnerId = null;

        // Resetar jogadores
        if (player1) {
            player1.table1 = createInitialMatrix()
            player1.table2 = createInitialMatrix()
            player1.playerShips = []
            player1.isReady = false
            player1.score = 0
        }

        if (player2) {
            player2.table1 = createInitialMatrix()
            player2.table2 = createInitialMatrix()
            player2.playerShips = []
            player2.isReady = false
            player2.score = 0
        }

        room.player1.score = 0;
        room.player1.shipsPlaced = false;
        room.player1.connected = true;

        room.player2.score = 0;
        room.player2.shipsPlaced = false;
        room.player2.connected = true;
    }
})


server.listen(PORT, () => console.log(`Server running on port ${PORT}`));