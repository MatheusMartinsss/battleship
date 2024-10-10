export function createGrid(playerId: string, canvas: any, grid: any, rects: any) {
    return {
        id: playerId,
        position: {
            x: 0,
            y: 0,
        },
        width: 400,
        height: 400,
        gridCellSize: 40,
        draggedRect: null,
        lineWidth: 1,
        rects: rects,
        grid: grid,
        isSecondTable: false,
        canvas: canvas,
    }
}

export function draw(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, grid: any) {
    context.save()
    context.beginPath()
    context.lineWidth = grid.lineWidth
    context.strokeStyle = 'green'
    canvas = canvas

    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
            // Verifica se a célula foi atingida (hited) e exibe uma mensagem no console
     
            // Define a cor com base no status 'hited' e se há um rectId presente
            context.fillStyle = grid.grid[row][col].hited ? 'red' : 'gray';
    
            // Desenha a box (célula)
            context.fillRect(col * grid.gridCellSize, row * grid.gridCellSize, grid.gridCellSize, grid.gridCellSize);
            context.strokeRect(col * grid.gridCellSize, row * grid.gridCellSize, grid.gridCellSize, grid.gridCellSize);
        }
    }
    Object.values(grid.rects).forEach((rect) => {
        drawRect(rect, context, grid);
    });
    context.stroke()
    context.closePath()
    context.restore()
}

function drawRect(rect: Rect, context: CanvasRenderingContext2D, grid: any) {
    context.fillStyle = rect.color
    context.fillRect((rect.col * grid.gridCellSize), (rect.row * grid.gridCellSize), rect.width, rect.height)

}