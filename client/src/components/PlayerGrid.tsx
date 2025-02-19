import Canvas from "./table"
import { useEffect, useRef, useState } from 'react'
import { useGameStore } from "@/context/gameStore"

type mousePos = {
    x: number;
    y: number;
}

const PlayerGrid = () => {
    const tableRef = useRef<HTMLCanvasElement>(null)
    const [draggedShip, setDraggedShip] = useState<any | null>(null)
    const { table1, moveShip, placeShip, room, role, isPlayerTurn } = useGameStore()
    const isPlacing = room.status == 'placing'
    const shipsPlaced = room[role].shipsPlaced || false
    useEffect(() => {
        if (tableRef.current && isPlacing) {
            handleListeners()
        }

        return () => {
            removeListeners()
        }
    }, [tableRef, draggedShip, table1, isPlacing])

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
        if (!position) return
        if (draggedShip && position) {
            setDraggedShip(null)
            placeShip({
                col: position.col,
                row: position.row,
                id: draggedShip,
            })
        } else {

            const gridClicked = table1.grid[position.col][position.row]
            const shipId = gridClicked.rectId
            setDraggedShip(shipId)
        }


    }
    const handleMouseUp = (event: MouseEvent) => {

    }

    const handleMouseMove = (event: MouseEvent) => {
        const position = getMousePosition(event.clientX, event.clientY)

        if (draggedShip && position) {
            moveShip({
                col: position.col,
                row: position.row,
                shipId: draggedShip
            })
        }
    }

    const gameLoop = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {

        const getGameState = useGameStore.getState;
        const currentState = getGameState();
        draw(context, canvas, currentState)
    }

    function draw(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gameState: ReturnType<typeof useGameStore.getState>) {

        const { table1, isPlayerTurn, room } = gameState;
        const { gridCellSize, ships, grid } = table1
        // Clear and draw background

        if (isPlayerTurn && room.status == 'battling') {
            canvas.style.border = '3px solid #22c55e'; // Using green color to match shadow
            canvas.style.boxShadow = '0 0 25px 5px rgba(34, 197, 94, 0.3)';
            canvas.style.transition = 'all 0.3s ease'; // Add smooth transition
        } else {
            canvas.style.border = 'none';
            canvas.style.boxShadow = 'none';
        }


        context.drawImage(table1.backGround, 0, 0, canvas.width, canvas.height);

        // Draw ships first
        context.save();

        ships.forEach(ship => {
            if (!ship.positions.length) return;

            // Calculate ship bounds
            const minCol = Math.min(...ship.positions.map(p => p.col));
            const minRow = Math.min(...ship.positions.map(p => p.row));
            const maxCol = Math.max(...ship.positions.map(p => p.col));
            const maxRow = Math.max(...ship.positions.map(p => p.row));


            // Determine orientation
            const isHorizontal = (maxCol - minCol) > (maxRow - minRow);

            const width = ship.orientation === 'horizontal'
                ? ship.size * gridCellSize
                : gridCellSize;

            const height = ship.orientation === 'vertical'
                ? ship.size * gridCellSize
                : gridCellSize;

            // Draw ship body

            context.fillStyle = ship.isSunk ? '#555' : '#1e40af';
            /*   context.drawImage(
                   ship.sprite,  // Source image
                   minCol * gridCellSize,        // X position
                   minRow * gridCellSize,        // Y position
                   width,                        // Destination width
                   height                        // Destination height
               );*/
            context.fillRect(
                minCol * gridCellSize,
                minRow * gridCellSize,
                (isHorizontal ? ship.positions.length : 1) * gridCellSize,
                (isHorizontal ? 1 : ship.positions.length) * gridCellSize
            );

            // Draw ship outline
            context.strokeStyle = '#ffffff';
            context.lineWidth = 2;
            context.strokeRect(
                minCol * gridCellSize,
                minRow * gridCellSize,
                (isHorizontal ? ship.positions.length : 1) * gridCellSize,
                (isHorizontal ? 1 : ship.positions.length) * gridCellSize
            );
        });

        context.restore();

        // Draw grid and hit markers
        context.save();
        context.lineWidth = table1.lineWidth;

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const cell = grid[col][row];

                // Draw hit/miss markers
                if (cell.rectId) {

                }
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

                // Draw grid lines
                context.strokeStyle = cell.rectId ? '#1e40af' : 'green';
                context.strokeRect(
                    col * gridCellSize,
                    row * gridCellSize,
                    gridCellSize,
                    gridCellSize
                );

                context.fillText(cell.rectId, col * gridCellSize,
                    row * gridCellSize)

            }
        }

        context.restore();

    }

    return (
        <>
            {isPlayerTurn && <h1>É seu turno</h1>}
            <Canvas height={400} width={400} gameLoop={gameLoop} canvasRef={tableRef} />
        </>
    )

}

export default PlayerGrid