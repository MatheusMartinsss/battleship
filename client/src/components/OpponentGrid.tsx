import Canvas from "./table"
import { useEffect, useRef, useState } from 'react'
import { useGameStore, useIsPlayerTurn } from "@/context/gameStore"
import { WaitingCard } from "./waitingPlayer"
import { useSocket } from '../context/useSocket'

const OpponentGrid = () => {
    const tableRef = useRef<HTMLCanvasElement>(null)
    const { opponent, table2 } = useGameStore()
    const isPlayerTurn = useIsPlayerTurn()
    const { socket } = useSocket()

    useEffect(() => {
        if (tableRef.current && isPlayerTurn) {
            handleListeners()
        }

        return () => {
            removeListeners()
        }
    }, [tableRef, table2, opponent, isPlayerTurn])

    const handleListeners = () => {
        if (tableRef.current) {
            tableRef.current.addEventListener('mousedown', handleMouseDown);
            tableRef.current.addEventListener('mousemove', handleMouseMove);
            tableRef.current.addEventListener('mouseup', handleMouseUp);
        }
    }

    const removeListeners = () => {
        if (tableRef.current) {
            tableRef.current.removeEventListener('mousedown', handleMouseDown);
            tableRef.current.removeEventListener('mousemove', handleMouseMove);
            tableRef.current.removeEventListener('mouseup', handleMouseUp);
        }
    }

    const getMousePosition = (x: number, y: number) => {
        if (tableRef.current) {
            const rect = tableRef.current.getBoundingClientRect()
            const cords = {
                x: (x - rect.left) / (rect.right - rect.left) * tableRef.current.width,
                y: (y - rect.top) / (rect.bottom - rect.top) * tableRef.current.height
            };
            const currentCol = Math.floor(cords.x / 40);
            const currentRow = Math.floor(cords.y / 40);
            return { col: currentCol, row: currentRow };
        }
    }

    const handleMouseDown = (event: MouseEvent) => {
        const position = getMousePosition(event.clientX, event.clientY)
        console.log(position)
        socket.emit('attack', { positions: position })

    }
    const handleMouseUp = (event: MouseEvent) => {

    }

    const handleMouseMove = (event: MouseEvent) => {
        const position = getMousePosition(event.clientX, event.clientY)

    }

    const gameLoop = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        const getGameState = useGameStore.getState;
        const currentState = getGameState();
        draw(context, canvas, currentState)
    }

    function draw(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gameState: any) {

        const { table2 } = gameState;
        const { grid, gridCellSize } = table2

        context.drawImage(table2.backGround, 0, 0, canvas.width, canvas.height);

        context.save();
        context.beginPath();
        context.lineWidth = table2.lineWidth;
        context.strokeStyle = 'green';

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const cell = grid[col][row];

                if (cell.isHit) {
                    context.beginPath();
                    context.fillStyle = cell.rectId ? '#dc2626' : '#3b82f6';
                    context.arc(
                        (col + 0.5) * gridCellSize,
                        (row + 0.5) * gridCellSize,
                        gridCellSize / 4,
                        0,
                        Math.PI * 2
                    );
                    context.fill();
                }
                // Desenha a box (célula)
                context.strokeRect(col * table2.gridCellSize, row * table2.gridCellSize, table2.gridCellSize, table2.gridCellSize);

            }
        }

        context.stroke();
        context.closePath();
        context.restore();

    }
    if (!opponent) return (
        <div className=" w-[400px] h-[400px]">
            <WaitingCard />
        </div>
    )
    return (
        <div className={`relative ${!isPlayerTurn
            ? 'animate-pulse-shadow border-2 border-green-400 rounded-lg'
            : ''}`}>

            <Canvas
                height={400}
                width={400}
                gameLoop={gameLoop}
                canvasRef={tableRef}

            />

        </div>
    )

}

export default OpponentGrid