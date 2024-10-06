const express = require('express');
const app = express();
const http = require('http');
const socket = require('socket.io');
const Room = require('./class/room')
const server = http.createServer(app);


const PORT = 3000 || process.env.PORT;

const io = socket(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})


let rooms = {
    
}
let players = {}

io.on('connection', (socket) => {

    console.log('a user connected:', socket.id);

    socket.on('join', (data) => {
        const { id, roomId = 0 } = data
        let room = findOrCreateRoom(roomId)
        room.addPlayer(id, {
            name: 'player1',
            rects: {},
            isReady: false
        })
        socket.join(roomId)
        socket.emit('connected', { data: room, id });
        socket.to(roomId).emit('joined', { data: room, id })
    })


    socket.on('ready', (request) => {
        const { rects, roomId } = request
        const room = findOrCreateRoom(roomId)
        room.players[socket.id].rects = rects
        room.players[socket.id].isReady = true
        socket.to(roomId).emit('ready', { id: socket.id })
        if (room.verifyPlayersIsAlready()) {
            startGame(roomId)
        }
    })
    socket.on('attack', (request) => {
        const { position, targetId, roomId } = request
        const room = findOneRoom(roomId)
        const attackResult = room.processeAttack(socket.id, targetId, position)
        socket.emit('attack-result', attackResult)
        io.to(targetId).emit('under-attack', attackResult)
        io.in(roomId).emit('update', {
            turnId: attackResult.nextTurnId
        })

    })
    socket.on('disconnect', () => {
        const room = findOneRoom(0)
        if (room?.players[socket.id]) {
            io.to(0).emit('disconnected', room)
            delete room.players[socket.id]
        }
    })

    function startGame(roomId) {
        const room = findOneRoom(roomId)
        room.status = 'started'
        room.turnId = room.firstPlayer
        io.to(roomId).emit('start', { turnId: room.turnId })
    }
    function updateRoom(roomId) {

        socket.to(roomId).emit('update', {
            response: rooms[roomId]
        })
    }
})


function findOrCreateRoom(roomId) {
    if (!rooms[roomId]) {
        rooms[roomId] = new Room({ id: roomId })
    }
    return rooms[roomId]
}

function findOneRoom(roomId) {
    return rooms[roomId]
}

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));