import { useEffect, useRef, useState } from 'react'
import Canvas from './components/table'
import { Room } from './class/Room'
import { useSocket } from './context/useSocket'
import { WaitingCard } from './components/waitingPlayer'
import { Label } from './components/ui/label'
import { Button } from './components/ui/button'

function App() {
  const { socket } = useSocket()
  const [room, setRoom] = useState<any>({})
  const table2Ref = useRef<HTMLCanvasElement>(null)
  const table1Ref = useRef<HTMLCanvasElement>(null)
  const [currentCanvas, setCurrentCanvas] = useState<HTMLCanvasElement | null>(null)
  const [connected, setConnected] = useState(false)
  const roomRef = useRef(room);

  useEffect(() => {
    roomRef.current = room
  }, [room])

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
      const { data, id } = response
      const room = new Room({
        id: data.id,
        firstPlayer: data.firstPlayer,
        status: data.status,
        turnId: data.turnId,
        winnerId: data.winnerId
      })
      setCurrentCanvas(table1Ref.current)
      room.addPlayers(data.players, id)
      setRoom(room)
      setConnected(true)
    })
  }, [socket])

  useEffect(() => {
    socket.on('joined', (response) => {
      const { data, id } = response
      const newState = roomRef.current
      newState.addPlayers(data.players, socket.id)
      setRoom({ ...newState })
    })
  }, [socket])

  useEffect(() => {
    socket.on('start', (response) => {
      const { turnId } = response
      const newState = roomRef.current
      newState.turnId = turnId
      newState.started = true
      if (newState.firstPlayer == turnId) {
        setCurrentCanvas(table2Ref.current)
        room.focusTable = room.secondPlayer
        alert('É o seu turno!')
      } else {
        setCurrentCanvas(null)
      }
      setRoom({ ...newState })
    })

  }, [socket])

  useEffect(() => {
    socket.on('update', (response) => {
      console.log('turno de ', response.turnId)
      const newState = roomRef.current
      newState.turnId = response.turnId
      if (response.turnId == socket.id) {
        console.log('E seu turno')
        setCurrentCanvas(table2Ref.current)
        room.focusTable = room.secondPlayer
      }
      setRoom({ ...newState })
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

      console.log('player', id, 'is ready')
    })
  }, [])
  useEffect(() => {
    socket.on('attack-result', (response) => {
      if (response.hited) {
        updateEnemyTable(response)
      } else {
        console.log('errou')
      }
      setCurrentCanvas(null)
    })
  }, [])
  useEffect(() => {
    socket.on('under-attack', (response) => {
      if (response.hited) {
        console.log('atingido')
      }
    })
  })
  const connect = () => {
    socket.emit('join', { id: socket.id })
  }
  const onConnect = () => {

  }
  const ready = () => {
    let currentState = { ...roomRef.current }
    let playerState = { ...currentState.players[currentState.firstPlayer].grid }
    socket.emit('ready', {
      rects: playerState.rects,
      roomId: room.id
    })
  }
  const attack = (position, targetId, roomId) => {
    socket.emit('attack', { position, targetId, roomId })
  }

  const updateEnemyTable = (response) => {
    const currentState = { ...roomRef.current }
    currentState.players[currentState.secondPlayer].grid.addRect(response.position.col, response.position.row, 1)
  }

  const gameLoopTable1 = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    room.players[room.firstPlayer].grid.draw(context, canvas)
  }
  const gameLoopTable2 = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    room.players[room.secondPlayer].grid.draw(context, canvas)
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
    const currentState = { ...roomRef.current.players[roomRef.current.focusTable] }
    const newState = { ...room }
    if (!currentState.grid.isSecondTable && position && !newState.started) {
      const selected = currentState.grid.grid[position.row][position.col]
      if (selected !== 0) {
        currentState.grid.draggedRect = selected
        currentState.grid.rects[selected].lastCol = position.col
        currentState.grid.rects[selected].lastRow = position.row
        newState.players[roomRef.current.focusTable] = currentState
        setRoom(newState)
      }
    } else if (newState.started && newState.turnId == newState.firstPlayer) {
      attack(position, room.secondPlayer, newState.id)
    }

  }
  const handleMouseUp = (event: MouseEvent) => {
    const currentState = { ...roomRef.current.players[roomRef.current.focusTable] }
    const newState = { ...room }
    if (currentState.grid.draggedRect && !newState.started) {
      const draggedRectIndex = currentState.grid.draggedRect
      const currenctRect = currentState.grid.rects[draggedRectIndex]
      if (currentState.grid.grid[currenctRect.row][currenctRect.col] == 0) { //Verifica se a nova posição é 0
        currentState.grid.grid[currenctRect.lastRow][currenctRect.lastCol] = 0  // Limpa a posição anterior
        currentState.grid.grid[currenctRect.row][currenctRect.col] = draggedRectIndex // Seta o ID do rect na grid
      } else {
        // Se não for 0 a posição ele retorna para posição anterior
        currenctRect.row = currenctRect.lastRow
        currenctRect.col = currenctRect.lastCol
        currentState.grid.rects[draggedRectIndex] = currenctRect
      }
      currentState.grid.draggedRect = null
      newState.players[roomRef.current.focusTable] = currentState
      setRoom(newState)
    }
  }

  const handleMouseMove = (event: MouseEvent) => {
    const position = getMousePosition(event.clientX, event.clientY)
    const currentState = { ...roomRef.current.players[roomRef.current.focusTable] }
    const newState = { ...room }
    if (position && currentState.grid.draggedRect && !newState.started) {
      let currentRect = currentState.grid.rects[currentState.grid.draggedRect]
      currentRect.col = position.col
      currentRect.row = position.row
      currentState.grid.rects[currentState.grid.draggedRect] = currentRect
      newState.players[roomRef.current.focusTable] = currentState
      setRoom(newState)
    }
  }
  const onTakeHit = () => {

  }
  const onHit = () => {

  }
  const handleAttack = (data) => {

  }
  return (
    <div className='flex flex-col space-y-2 items-center'>
      {room.started && (
        <Label>Turno de {room.turnId}</Label>
      )}
      {connected ? (
        <>
          <Label>Player: {room?.secondPlayer} </Label>
          {room.secondPlayer ? (
            <div className='flex flex-col'>
              <Canvas height={400} width={400} gameLoop={gameLoopTable2} canvasRef={table2Ref} />
            </div>

          ) : (
            <WaitingCard />
          )}
          <div className='flex flex-col'>
            <Label>Player: {room.firstPlayer} </Label>
            <Canvas height={400} width={400} gameLoop={gameLoopTable1} canvasRef={table1Ref} />
          </div>
        </>
      ) : (

        <button onClick={connect}>Entrar na sala</button>
      )}
      <Button onClick={ready}>Pronto</Button>
    </div>
  )
}

export default App
