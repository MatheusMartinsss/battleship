import { useState } from 'react'
import Canvas from './components/table'
import { Grid } from './class/Grid'

function App() {
  const Grid1 = new Grid({
    gridCellSize: 50,
    height: 500,
    width: 500,
    lineWidth: 1,
    position: {
      x: 0,
      y: 0
    }
  })

  const gameLoop = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    Grid1.draw(context, canvas)
  }

  return (

    <Canvas gameLoop={gameLoop}   />


  )
}

export default App
