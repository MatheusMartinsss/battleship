const express = require('express');
const app = express();
const http = require('http');
const socket = require('socket.io');
const server = http.createServer(app);


const PORT = 3000 || process.env.PORT;

const io = socket(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})


let rooms = [{
    players: {}
}]

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        const { id } = data
        console.log(id)
        rooms[0].players[id] = {
            name: 'player1',
        }
        socket.join(0)
        io.to(0).emit('connected', rooms[0])
    })
})

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));