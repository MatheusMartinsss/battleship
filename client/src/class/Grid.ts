interface GridProps {
    position: {
        x: number;
        y: number;
    };
    width: number;
    height: number;
    gridCellSize: number;
    lineWidth: number;
}

interface Rect {
    row: number;
    col: number;
    lastCol: number | null
    lastRow: number | null;
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
    rects: { [key: string]: Rect }
    grid: number[][]
    canvas?: HTMLCanvasElement
    startedListeners: boolean
    private draggedRect: number | null

    constructor({
        position,
        width,
        height,
        gridCellSize,
        lineWidth = 1

    }: GridProps) {
        this.position = position;
        this.draggedRect = null
        this.grid = [
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
        this.rects = {}
        this.rects['1'] = {
            col: 1,
            row: 1,
            lastCol: 1,
            lastRow: 1,
            size: 2,
            color: 'green',
            height: 50,
            width: 50
        }
        this.grid[1][1] = 1
        this.width = width;
        this.height = height;
        this.gridCellSize = gridCellSize;
        this.lineWidth = lineWidth;
        this.startedListeners = false

    }

    draw(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        context.save()
        context.beginPath()
        context.lineWidth = this.lineWidth
        context.strokeStyle = 'green'
        this.canvas = canvas

        for (let lx = this.position.x; lx < this.position.x + this.width; lx += this.gridCellSize) {
            context.moveTo(lx, this.position.y)
            context.lineTo(lx, this.position.y + this.height)
        }

        for (let ly = this.position.y; ly < this.position.y + this.height; ly += this.gridCellSize) {
            context.moveTo(this.position.x, ly)
            context.lineTo(this.position.x + this.width, ly)
        }
        /*    if (this.draggedRect) {
                this.drawRect(this.draggedRect, context)
            }*/

        Object.values(this.rects).forEach((rect) => {
            this.drawRect(rect, context);
        });

        if (this.canvas && !this.startedListeners) {
            this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
            this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
            this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
            this.startedListeners = true
        }
        context.stroke()
        context.closePath()
        context.restore()
    }

    private handleMouseDown(event: MouseEvent) {
        const position = this.getMousePosition(event.clientX, event.clientY)
        if (position && this.grid[position.col][position.row] != 0) {
            const draggeRectKey = this.grid[position.col][position.row]
            this.draggedRect = draggeRectKey
            this.rects[draggeRectKey].lastCol = position.col // Seta a ultima col 
            this.rects[draggeRectKey].lastRow = position.row // Seta a ultima row

        }

    }

    private getMousePosition(x: number, y: number): { col: number, row: number } | null {
        if (this.canvas) {
            const rect = this.canvas.getBoundingClientRect();
            const cords = {
                x: (x - rect.left) / (rect.right - rect.left) * this.canvas.width,
                y: (y - rect.top) / (rect.bottom - rect.top) * this.canvas.height
            };
            const currentCol = Math.floor(cords.x / 50);
            const currentRow = Math.floor(cords.y / 50);

            return { col: currentCol, row: currentRow };
        }
        return null;
    }

    private handleMouseMove(event: MouseEvent) {
        const position = this.getMousePosition(event.clientX, event.clientY)
        if (position && this.draggedRect) {
            let currentRect = this.rects[this.draggedRect]
            currentRect.col = position.col
            currentRect.row = position.row
            this.rects[this.draggedRect] = currentRect
        }
    }

    private handleMouseUp(event: MouseEvent) {
        if (this.draggedRect) {
            let currentRect = this.rects[this.draggedRect]
            if (currentRect.lastRow && currentRect.lastCol) {
                this.grid[currentRect.lastCol][currentRect.lastRow] = 0
                this.grid[currentRect.col][currentRect.row] = 1
            }
            this.rects[this.draggedRect] = currentRect
            this.draggedRect = null
        }
    }

    drawRect(rect: Rect, context: CanvasRenderingContext2D) {
        context.fillStyle = rect.color
        context.fillRect((rect.col * this.gridCellSize), (rect.row * this.gridCellSize), rect.width, rect.height)
    }
}