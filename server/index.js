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
function createInitialMatrix() {
    return Array.from({ length: 10 }, (row, rowIndex) =>
        Array.from({ length: 10 }, (col, colIndex) => {
            return {
                id: colIndex + 1,  // Id baseado na posição inicial
                status: 'inactive',  // Nenhum rect, status inicial é 'inactive'
                rectId: null,       // Nenhum rect associado
                hited: false        // Outro atributo que pode ser modificado depois
            };
        })
    );
}


io.on('connection', (socket) => {
    let initialMatrix = createInitialMatrix()
    let initialEnemyMatrix = createInitialMatrix()

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

        const { players, room } = handleAttack(socket.id, targetId, position, roomId)
        let hasWinner = false;
        if (room.winnerId) {
            hasWinner = true
        }
        io.in(roomId).emit('attack-result', { players, room, targetId, attackerId: socket.id, hasWinner })
    })

    socket.on('restart', (request) => {
        const { roomId } = request

        let room = findOrCreateRoom(roomId)


        room.status = 'waiting'
        room.winnerId = null
        room.turnId = null
        resetMatrix()

        const playersRoom = findPlayersByRoom(roomId)

        playersRoom.map((player) => {
            return players[player.id] = generatePlayer(player.id, player.roomId)
        })

        io.in(roomId).emit('restart', { players: findPlayersByRoom(roomId), room })


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

    function findOrCreateRoom(roomId) {
        if (!rooms[roomId]) {
            rooms[roomId] = new Room({ id: roomId })
        }
        return rooms[roomId]
    }
    function findOrAddPlayer(playerId, roomId) {
        if (!players[playerId]) {
            // Inicializa o jogador com o grid vazio
            const player = generatePlayer(playerId, roomId)
            players[playerId] = player; // Salva o jogador na lista de players
        }
        return players[playerId];
    }
    function generatePlayer(playerId, roomId) {
        return new Player({
            id: playerId,
            roomId,
            name: '',
            score: 0,
            grid: initialMatrix,
            enemyGrid: initialEnemyMatrix,
            eRects: {},
            rects: {
                [1]: generateRect(1, initialMatrix),
                [2]: generateRect(2, initialMatrix),
                [3]: generateRect(3, initialMatrix),
                [4]: generateRect(4, initialMatrix)
            },
            status: 'waiting',
        });
    }
    function findPlayersByRoom(roomId, playerId) {
        const ids = rooms[roomId].players;
        return ids.map((id) => {
            return players[id]
        });
    }
    function generateRect(rectId, matrix) {
        const randomCol = Math.floor(Math.random() * 10);
        const randomRow = Math.floor(Math.random() * 10);
        matrix[randomRow][randomCol].rectId = rectId
        return {
            col: randomCol,
            row: randomRow,
            lastCol: randomCol,
            lastRow: randomRow,
            height: 40,
            width: 40,
            status: 'alive',
            color: 'red',
            size: 2
        }
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

    function handleAttack(playerId, targetID, position, roomId) {

        let { col, row } = position
        let player = findOnePlayer(playerId)
        let target = findOnePlayer(targetID)
        let room = rooms[roomId]
        const rectHitedId = target.grid[row][col].rectId

        if (rectHitedId) {
            target.rects[rectHitedId] = handleHitRect(target.rects[rectHitedId])
            player.score++;
        }
        if (player.score == 4) {
            room.winnerId = player.id
        }

        target.grid[row][col] = handleHitGrid(target.grid[row][col], rectHitedId)
        player.enemyGrid[row][col] = handleHitGrid(target.enemyGrid[row][col], rectHitedId)
        let newERects = { ...player.eRects, [rectHitedId]: target.rects[rectHitedId] }
        player.eRects = newERects

        room.turnId = targetID

        players[targetID] = target
        players[playerId] = player
        rooms[roomId] = room

        const playersUpdated = findPlayersByRoom(roomId)
        return {
            players: playersUpdated,
            room
        }

    }
    function handleHitGrid(grid, rectId) {
        return { ...grid, hited: true, rectId }
    }

    function handleHitRect(rect) {
        return { ...rect, status: 'exploded' }
    }
    function resetMatrix() {
        initialMatrix = createInitialMatrix();  // Restaura a matriz ao estado inicial
        initialEnemyMatrix = createInitialMatrix();
    }
})


server.listen(PORT, () => console.log(`Server running on port ${PORT}`));