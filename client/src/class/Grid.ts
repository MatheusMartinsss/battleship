interface GridProps {
    position: {
        x: number;
        y: number;
    };
    width: number;
    height: number;
    gridCellSize: number;
    grid?: number[][]
    isSecondTable?: boolean
    lineWidth: number;
    isStarted: boolean
    draggedRect?: number | null
    isTurn: boolean
    isReady: boolean
}

interface Rect {
    row: number;
    col: number;
    lastCol: number;
    lastRow: number;
    width: number;
    height: number;
    color: string;
    size: number;
}


export class Grid {
    position: {
        x: number;
        y: number;
    };
    width: number;
    height: number;
    gridCellSize: number;
    lineWidth: number;
    rects: { [key: number]: Rect }
    grid: number[][]
    isSecondTable: boolean
    canvas?: HTMLCanvasElement
    draggedRect?: number | null

    constructor({
        position,
        width,
        height,
        gridCellSize,
        draggedRect = null,
        isSecondTable = false,
        lineWidth = 1,
        grid = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],

        ]

    }: GridProps) {
        this.position = position;
        this.isSecondTable = isSecondTable
        this.draggedRect = draggedRect
        this.grid = grid
        this.rects = {}
        this.width = width;
        this.height = height;
        this.gridCellSize = gridCellSize;
        this.lineWidth = lineWidth;
    }

    draw(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        context.save()
        context.beginPath()
        context.lineWidth = this.lineWidth
        context.strokeStyle = 'green'
        this.canvas = canvas

        for (let row = 0; row < this.grid.length; row++) {
            for (let col = 0; col < this.grid[row].length; col++) {
                context.fillStyle = this.grid[row][col] === 0 ? 'gray' : 'black'
                context.fillRect(col * this.gridCellSize, row * this.gridCellSize, this.gridCellSize, this.gridCellSize);
                context.strokeRect(col * this.gridCellSize, row * this.gridCellSize, this.gridCellSize, this.gridCellSize);

            }
        }
        Object.values(this.rects).forEach((rect) => {
            this.drawRect(rect, context);
        });
        context.stroke()
        context.closePath()
        context.restore()
    }

    addRect(col: number, row: number, id: number) {
        console.log('add in col', col, 'add in row', row, 'id', id)
        this.rects[id] = {
            col,
            row,
            lastCol: col,
            lastRow: row,
            height: 40,
            width: 40,
            color: 'red',
            size: 2
        }
        this.grid[row][col] = id
    }

    drawRect(rect: Rect, context: CanvasRenderingContext2D) {
        context.fillStyle = rect.color
        context.fillRect((rect.col * this.gridCellSize), (rect.row * this.gridCellSize), rect.width, rect.height)

    }
    
}