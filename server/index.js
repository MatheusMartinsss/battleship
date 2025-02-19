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

io.on('connection', (socket) => {


    socket.on('create', ({ roomName, playerName }) => {

        const roomId = uuidv4();

        if (!rooms[roomId]) {
            rooms[roomId] = {
                ...initialRoom,
                id: roomId,
                roomName,
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
            roomId: roomCode
        }

        socket.join(roomCode)

        socket.to(roomCode).emit('joined', { player: players[socket.id] });

        socket.emit('joined', { room, player: players[socket.id], opponent: players[room.player1.id], role: 'player2' });

        io.in(roomCode).emit('room-update', room);

    })


    socket.on('ready', ({ roomId, role }) => {
        const room = rooms[roomId]
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
        io.in(room.id).emit('room-update', room);
    })

    socket.on('attack', ({targetId, positions}) => {
        const player = players[socket.id]

        const room = rooms[player.roomId]

        room.turnId = room.turnId == room.player1.id ? room.player2.id : room.player1.id


        io.in(room.id).emit('room-update', room);

    })

    socket.on('restart', (request) => {



    })

    socket.on('disconnect', () => {
        //  onPlayerLeave(socket.id)
    })


})


server.listen(PORT, () => console.log(`Server running on port ${PORT}`));