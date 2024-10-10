const express = require('express');
const app = express();
const http = require('http');
const socket = require('socket.io');
const Room = require('./class/room')
const Player = require('./class/player')
const server = http.createServer(app);
const { v4: uuidv4 } = require('uuid');

const PORT = 3000 || process.env.PORT;

const io = socket(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

let rooms = {}
let players = {}



io.on('connection', (socket) => {
    const initialMatrix = Array.from({ length: 10 }, (row, rowIndex) =>
        Array.from({ length: 10 }, (col, colIndex) => {
            if (rowIndex === 0 && colIndex < 4) {
                return {
                    id: colIndex + 1,  // Id baseado na posição inicial
                    status: 'active',  // Status inicial apenas para os primeiros 4
                    rectId: colIndex + 1,
                    hited: false       // Outro atributo que pode ser modificado depois
                };
            } else {
                return {
                    id: colIndex + 1,
                    status: 'inactive',  // Status padrão para os demais,
                    rectId: null,
                    hited: false
                };
            }
        })
    );
    const initialEnemyMatrix = Array.from({ length: 10 }, (row, rowIndex) =>
        Array.from({ length: 10 }, (col, colIndex) => {
            return {
                id: colIndex + 1,  // Id baseado na posição inicial
                status: 'inactive',  // Nenhum rect, status inicial é 'inactive'
                rectId: null,       // Nenhum rect associado
                hited: false        // Outro atributo que pode ser modificado depois
            };
        })
    );
    socket.on('create', () => {
        const userId = uuidv4();
        findOrCreateRoom(userId)
        socket.emit('created', { id: userId })
    })
    socket.on('join', (data) => {
        const { id, roomId } = data

        let room = findOrCreateRoom(roomId)

        if (room.players.length == 2 || room.status == 'started') return

        let player = findOrAddPlayer(socket.id, roomId)

        rooms[roomId].addPlayer(player.id)

        socket.join(roomId)

        socket.emit('connected', { room, players: findPlayersByRoom(roomId, socket.id), id: socket.id });

        socket.to(roomId).emit('joined', { data: room, players: findPlayersByRoom(roomId, socket.id), id: socket.id })
    })


    socket.on('ready', (request) => {
        const { rects, grid, roomId } = request

        players[socket.id].rects = rects
        players[socket.id].grid = grid
        players[socket.id].isReady = true

        socket.to(roomId).emit('ready', { id: socket.id })

        if (verifyallPlayersIsReady(roomId)) {
            startGame(roomId)
        }
    })
    socket.on('attack', (request) => {
        const { position, targetId, roomId } = request

        const player = players[socket.id]

        const attackResult = verifyAttack(socket.id, targetId, position)
        players[socket.id].enemyGrid[position.row][position.col].hited = true

        console.log('player is updated', players[socket.id].enemyGrid, players[targetId].enemyGrid)
        socket.emit('attack-result', { player: players[socket.id] })

        io.to(targetId).emit('under-attack', attackResult)

        io.in(roomId).emit('update', {
            turnId: targetId
        })

    })
    socket.on('disconnect', () => {
        onPlayerLeave(socket.id)
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
    function findOrCreateRoom(roomId) {
        if (!rooms[roomId]) {
            rooms[roomId] = new Room({ id: roomId })
        }
        return rooms[roomId]
    }
    function findOrAddPlayer(playerId, roomId) {
        if (!players[playerId]) {
            // Inicializa o jogador com o grid vazio
            const player = new Player({
                id: playerId,
                roomId,
                grid: initialMatrix,
                enemyGrid: initialEnemyMatrix,
                rects: playerId == socket.id ? {
                    [1]: {
                        col: 0,
                        row: 0,
                        lastCol: 2,
                        lastRow: 0,
                        height: 40,
                        width: 40,
                        color: 'red',
                        size: 2
                    },
                    [2]: {
                        col: 1,
                        row: 0,
                        lastCol: 1,
                        lastRow: 0,
                        height: 40,
                        width: 40,
                        color: 'red',
                        size: 2
                    },
                    [3]: {
                        col: 2,
                        row: 0,
                        lastCol: 2,
                        lastRow: 0,
                        height: 40,
                        width: 40,
                        color: 'red',
                        size: 2
                    },
                    [4]: {
                        col: 3,
                        row: 0,
                        lastCol: 3,
                        lastRow: 0,
                        height: 40,
                        width: 40,
                        color: 'red',
                        size: 2
                    }
                } : {},
                status: 'waiting',
            });

            players[playerId] = player; // Salva o jogador na lista de players
        }
        return players[playerId];
    }
    function findPlayersByRoom(roomId, playerId) {
        const ids = rooms[roomId].players;
        return ids.map((id) => {
            return players[id]
        });
    }
    function findOneRoom(roomId) {
        return rooms[roomId]
    }
    function findOnePlayer(playerId) {
        return players[playerId]
    }

    function onPlayerLeave(playerId) {
        const player = players[playerId]
        if (!player) return

        const room = rooms[player.roomId]

        delete players[playerId]

        room.removePlayer(playerId)

        io.to(player.roomId).emit('disconnected', {
            id: player.id
        })
    }
    function verifyallPlayersIsReady(roomId) {
        const players = findPlayersByRoom(roomId)
        return Object.values(players).every(player => player.isReady === true);
    }
    function verifyAttack(attackerId, targetId, position) {

        const target = findOnePlayer(targetId)
        const hitRect = Object.values(target.rects).find((rect) => rect.col == position.col && rect.row == position.row);
        return {
            hited: !!hitRect,
            position: position,
            rectHit: hitRect || null,
            attackerId,
            targetId,
            nextTurnId: targetId
        }
    }
})


server.listen(PORT, () => console.log(`Server running on port ${PORT}`));