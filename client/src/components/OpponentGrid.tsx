import Canvas from "./table"
import { useEffect, useRef } from 'react'
import { useGameStore, useIsPlayerTurn } from "@/context/gameStore"
import { WaitingCard } from "./waitingPlayer"
import { useSocket } from '../context/useSocket'
import { cn } from "@/lib/utils"

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
        socket.emit('attack', { positions: position })

    }
    const handleMouseUp = () => {

    }

    const handleMouseMove = () => {


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
  
    return (
        <div className="flex flex-col">
            <div className={cn(
                "text-xl font-bold tracking-wide",
                "flex items-center gap-2 justify-center",
                "drop-shadow-lg mb-4",
                "relative group",
                // Estilos base
                "bg-gradient-to-r from-blue-900/80 to-navy-800/80",
                "px-6 py-3 rounded-full",
                "border-2 border-sky-700/50",
                "backdrop-blur-sm",
                "transition-all duration-300",
                "hover:scale-105 hover:shadow-xl",
            )}>
                <div className="absolute inset-0 rounded-full overflow-hidden">
                    <div className="absolute -inset-8 animate-spin-slow">
                        <div className="w-full h-full bg-[conic-gradient(var(--tw-gradient-from),transparent_30%)] from-transparent via-white/10 to-transparent opacity-20" />
                    </div>
                </div>
                <span className={cn(
                    "text-shadow-md relative z-10",
                    "bg-clip-text text-transparent",
                    "bg-gradient-to-r from-sky-300 to-blue-100",
                )}>
                    {opponent?.name}
                </span>
            </div>
            {!opponent ? (
                <div className=" w-[400px] h-[400px]">
                    <WaitingCard />
                </div>
            ) : (
                <div className={`relative ${!isPlayerTurn ? 'animate-pulse-shadow-opponent' : ''}`}>
                    <Canvas
                        height={400}
                        width={400}
                        gameLoop={gameLoop}
                        canvasRef={tableRef}
                    />
                </div>
            )}
        </div>
    )

}

export default OpponentGrid