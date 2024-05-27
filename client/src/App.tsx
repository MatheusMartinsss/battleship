import { useEffect, useState } from 'react'
import Canvas from './components/table'
import { Grid } from './class/Grid'
import { useSocket } from './context/useSocket'

function App() {
  const [connected, setConnected] = useState(false)
  const { socket } = useSocket()

  const currentPlayer = new Grid({
    gridCellSize: 40,
    height: 400,
    width: 400,
    lineWidth: 1,
    position: {
      x: 0,
      y: 0
    }
  })

  const enemyPlayer = new Grid({
    gridCellSize: 40,
    height: 400,
    width: 400,
    lineWidth: 1,
    isSecondTable: true,
    position: {
      x: 0,
      y: 0
    }
  })

  socket.on('connected', (data) => {
    console.log(data)
  })

  const connect = () => {
    socket.emit('join', { id: socket.id })
  }
  currentPlayer.addRect(0, 1, 1)
  currentPlayer.addRect(0, 2, 2)

  const gameLoopTable = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    currentPlayer.draw(context, canvas)
  }

  const gameLoopTable2 = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    enemyPlayer.draw(context, canvas)

  }

  return (
    <div className='flex flex-col space-y-2 items-center'>
      <Canvas height={400} width={400} gameLoop={gameLoopTable} />
      <Canvas height={400} width={400} gameLoop={gameLoopTable2} />
      <button onClick={connect}>Entrar na sala</button>
    </div>
  )
}

export default App
