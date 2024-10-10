import { useEffect, useRef, useState } from 'react'
import Canvas from '../components/table'
import { useSocket } from '../context/useSocket'
import { WaitingCard } from '../components/waitingPlayer'
import { Label } from '../components/ui/label'
import { Button } from '../components/ui/button'
import { createGrid, draw } from '../lib/grid'
import { useParams } from 'react-router-dom';

function Game() {
    const { socket } = useSocket()
    const { roomId } = useParams(); // Acessa o parâmetro da rota
    const [room, setRoom] = useState<any>({
        roomId: roomId,
        turnId: null,
        status: 'waiting',
        started: false,
        players: {},

    })

    const [playerGrid, setPlayerGrid] = useState(null)
    const [enemyGrid, setEnemyGrid] = useState(null)
    const [isPlayerTurn, setPlayerTurn] = useState(false)
    const [isLoading, setLoading] = useState(true)
    const [player1, setPlayer1] = useState(null)
    const [player2, setPlayer2] = useState(null)
    const table2Ref = useRef<HTMLCanvasElement>(null)
    const table1Ref = useRef<HTMLCanvasElement>(null)
    const [currentCanvas, setCurrentCanvas] = useState<HTMLCanvasElement | null>(null)
    const [connected, setConnected] = useState(false)
    const roomRef = useRef(room);
    const playerGridRef = useRef(playerGrid)
    const enemyGridRef = useRef(enemyGrid)

    const play1Ref = useRef(player1)
    const play2Ref = useRef(player2)

    useEffect(() => connect(),
        [roomId])


    useEffect(() => {
        roomRef.current = room
    }, [room])

    useEffect(() => {
        play1Ref.current = player1
    }, [player1])

    useEffect(() => {
        play2Ref.current = player2
    }, [player2])

    useEffect(() => {
        playerGridRef.current = playerGrid
    }, [playerGrid])

    useEffect(() => {
        enemyGridRef.current = enemyGrid
    }, [enemyGrid])


    useEffect(() => {
        if (table1Ref.current) {
            setCurrentCanvas(table1Ref.current)
        }
    }, [connected])

    useEffect(() => {
        if (currentCanvas) {
            handleListeners(currentCanvas)
        }

        return () => {
            if (table1Ref.current) {
                removeListeners(table1Ref.current)
            }
            if (table2Ref.current) {
                removeListeners(table2Ref.current)
            }
        }
    }, [currentCanvas])

    useEffect(() => {
        socket.on('connected', (response) => {
            const { room, players, id } = response;
            console.log(players)
            // Estados temporários para os jogadores e grids
            let player1Data = null;
            let player2Data = null;
            let player1Grid = null;
            let player2Grid = null;

            players.forEach((player) => {
                if (player.id === id) {
                    player1Data = { ...player };
                    player1Grid = createGrid(player.id, table1Ref.current, player.grid, player.rects);
                } else {
                    player2Data = { ...player };
                    player2Grid = createGrid(player.id, table2Ref.current, player.enemyGrid, {});
                }
            });


            setPlayer1(player1Data);
            setPlayerGrid(player1Grid);
            setPlayer2(player2Data);
            setEnemyGrid(player2Grid);

            setCurrentCanvas(table1Ref.current);

            setRoom(room);
            setLoading(false)
            setConnected(true);
        });

        return () => {
            socket.off('connected');
        };
    }, [socket]);

    useEffect(() => {
        socket.on('joined', (response) => {
            console.log(response)
            const { data, players, id } = response
            players.map((player) => {
                if (player.id == id) {
                    setPlayer2(player)
                    setEnemyGrid(createGrid(player.id, table2Ref.current, player.enemyGrid, {}))
                }
            })
            setRoom(data)
        })
    }, [socket])

    useEffect(() => {
        socket.on('start', (response) => {

            const { turnId } = response

            const newState = { ...roomRef.current, turnId: turnId, started: true, status: 'started' }

            if (play1Ref.current && play1Ref.current.id == turnId) {

                setPlayerTurn(true)
                setCurrentCanvas(table2Ref.current)
                alert('É o seu turno!')

            } else {

                setPlayerTurn(false)
                setCurrentCanvas(null)
            }

            setRoom({ ...newState })
        })

    }, [socket])

    useEffect(() => {
        socket.on('update', (response) => {
            const newState = { ...roomRef.current, turnId: response.turnId }
            if (response.turnId == socket.id) {
                setPlayerTurn(true)
                setCurrentCanvas(table2Ref.current)
            }
            setRoom(newState)
        })
        return () => {
            socket.off('update');
        };
    }, [socket, room])

    useEffect(() => {
        socket.on('disconnected', ({ id }) => {
            if (id !== socket.id) {
                setEnemyGrid(null)
            }
        })
    }, [socket])

    useEffect(() => {
        socket.on('attack', ({ data }) => {
            handleAttack(data)
        })
    }, [])
    useEffect(() => {
        socket.on('ready', (response) => {
            const { id } = response

        })
    }, [])
    useEffect(() => {

        socket.on('attack-result', (response) => {
            console.log('attack result', response.player)
            const newState = { ...enemyGridRef.current, grid: response.player.enemyGrid }
            setEnemyGrid({ ...newState })
            setCurrentCanvas(null)
        })
    }, [])

    useEffect(() => {
        socket.on('under-attack', (response) => {
            if (response.hited) {

            }
        })
    })
    const connect = () => {
        console.log(roomId)
        socket.emit('join', { id: socket.id, roomId: roomId })
    }
    const onConnect = () => {

    }
    const ready = () => {
        socket.emit('ready', {
            rects: playerGridRef.current.rects,
            grid: playerGridRef.current.grid,
            roomId: room.id
        })
    }
    const attack = (position, targetId, roomId) => {
        setPlayerTurn(false)
        socket.emit('attack', { position, targetId, roomId })
    }

    const updateEnemyTable = (response) => {
        const currentState = { ...roomRef.current }
        // currentState.players[currentState.secondPlayer].grid.addRect(response.position.col, response.position.row, 1)
    }

    const gameLoopTable1 = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        draw(context, canvas, playerGridRef.current)
    }
    const gameLoopTable2 = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        draw(context, canvas, enemyGridRef.current)
    }

    const handleListeners = (table: HTMLCanvasElement) => {
        table.addEventListener('mousedown', handleMouseDown);
        table.addEventListener('mousemove', handleMouseMove);
        table.addEventListener('mouseup', handleMouseUp);
    }

    const removeListeners = (table: HTMLCanvasElement) => {
        table.removeEventListener('mousedown', handleMouseDown);
        table.removeEventListener('mousemove', handleMouseMove);
        table.removeEventListener('mouseup', handleMouseUp);
    }

    const getMousePosition = (x: number, y: number) => {
        if (currentCanvas) {
            const rect = currentCanvas.getBoundingClientRect()
            const cords = {
                x: (x - rect.left) / (rect.right - rect.left) * currentCanvas.width,
                y: (y - rect.top) / (rect.bottom - rect.top) * currentCanvas.height
            };
            const currentCol = Math.floor(cords.x / 40);
            const currentRow = Math.floor(cords.y / 40);
            return { col: currentCol, row: currentRow };
        }
    }

    const handleMouseDown = (event: MouseEvent) => {
        const position = getMousePosition(event.clientX, event.clientY)
        const currentState = getPlayerFocusTable()
        if (currentState && position && !isPlayerTurn && !room.started) {
            const selected = currentState.grid[position.row][position.col].rectId
            if (selected) {
                currentState.draggedRect = selected
                currentState.rects[selected].lastCol = position.col
                currentState.rects[selected].lastRow = position.row
                setPlayerGrid(currentState)
            }
        } else if (room.started && isPlayerTurn) {
            attack(position, play2Ref.current.id, room.id)
        }

    }
    const handleMouseUp = (event: MouseEvent) => {
        const currentState = getPlayerFocusTable()
        if (currentState && currentState.draggedRect) {
            const draggedRectIndex = currentState.draggedRect
            const currenctRect = currentState.rects[draggedRectIndex]
            if (!currentState.grid[currenctRect.row][currenctRect.col].rectId) { //Verifica se a nova posição é 0
                currentState.grid[currenctRect.lastRow][currenctRect.lastCol].rectId = null  // Limpa a posição anterior
                currentState.grid[currenctRect.row][currenctRect.col].rectId = draggedRectIndex // Seta o ID do rect na grid
            } else {
                // Se não for 0 a posição ele retorna para posição anterior
                currenctRect.row = currenctRect.lastRow
                currenctRect.col = currenctRect.lastCol
                currentState.rects[draggedRectIndex] = currenctRect
            }
            currentState.draggedRect = null
            setPlayerGrid(currentState)
        }
    }

    const handleMouseMove = (event: MouseEvent) => {
        const position = getMousePosition(event.clientX, event.clientY)
        const currentState = getPlayerFocusTable()
        if (currentState && position && currentState.draggedRect) {
            let currentRect = currentState.rects[currentState.draggedRect]
            currentRect.col = position.col
            currentRect.row = position.row
            currentState.rects[currentState.draggedRect] = currentRect
            setPlayerGrid(currentState)
        }
    }

    const getPlayerFocusTable = () => {
        if (!roomRef.turnId && roomRef.status != 'started') {
            return playerGrid
        }
        if (roomRef.turnId == socket.id) {
            return enemyGrid
        }
        return null
    }

    const onTakeHit = () => {

    }
    const onHit = () => {

    }
    const handleAttack = (data) => {

    }

    if (isLoading) return <div> Carregando..</div>
    return (
        <div className='flex flex-col space-y-2 items-center'>
            {room.started && (
                <Label>Turno de {room.turnId}</Label>
            )}

            <>
                <Label>Player: {player2?.id} </Label>
                {room.secondPlayer ? (
                    <div className='flex flex-col'>
                        <Canvas height={400} width={400} gameLoop={gameLoopTable2} canvasRef={table2Ref} />
                    </div>

                ) : (
                    <WaitingCard />
                )}
                <div className='flex flex-col'>
                    <Label>Player: {player1?.id} </Label>
                    <Canvas height={400} width={400} gameLoop={gameLoopTable1} canvasRef={table1Ref} />
                </div>
            </>
            <Button onClick={ready}>Pronto</Button>
        </div>
    )
}
export default Game