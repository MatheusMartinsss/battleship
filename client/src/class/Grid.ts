interface GridProps {
    position: {
        x: number;
        y: number;
    };
    width: number;
    height: number;
    gridCellSize: number;
    isSecondTable?: boolean
    lineWidth: number;
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
    rects: { [key: string]: Rect }
    grid: number[][]
    isSecondTable: boolean
    canvas?: HTMLCanvasElement
    startedListeners: boolean
    private draggedRect: number | null

    constructor({
        position,
        width,
        height,
        gridCellSize,
        isSecondTable = false,
        lineWidth = 1

    }: GridProps) {
        this.position = position;
        this.isSecondTable = isSecondTable
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


        for (let row = 0; row < this.grid.length; row++) {
            for (let col = 0; col < this.grid[row].length; col++) {
                context.fillStyle = this.grid[row][col] === 0 ? 'gray' : 'black'
                context.fillRect(col * this.gridCellSize, row * this.gridCellSize, this.gridCellSize, this.gridCellSize);
                context.strokeRect(col * this.gridCellSize, row * this.gridCellSize, this.gridCellSize, this.gridCellSize);
            }
        }

        /*
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

    addRect(col: number, row: number, id: number) {
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
    private handleMouseDown(event: MouseEvent) {
        const position = this.getMousePosition(event.clientX, event.clientY)
        if (position && this.grid[position.row][position.col] && !this.isSecondTable) {
            const draggeRectKey = this.grid[position.row][position.col]
            this.draggedRect = draggeRectKey
            this.rects[draggeRectKey].lastCol = position.col // Seta a ultima col 
            this.rects[draggeRectKey].lastRow = position.row // Seta a ultima row
        }

    }
    private getMousePosition(x: number, y: number): { col: number, row: number } | null {
        if (this.canvas) {
            const rect = this.canvas.getBoundingClientRect();

            // Calcula as coordenadas do mouse relativas ao canvas
            const cords = {
                x: (x - rect.left) / (rect.right - rect.left) * this.canvas.width,
                y: (y - rect.top) / (rect.bottom - rect.top) * this.canvas.height
            };


            // Calcula as posições da coluna e linha
            const currentCol = Math.floor(cords.x / 40);
            const currentRow = Math.floor(cords.y / 40);

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
            if (this.grid[currentRect.lastRow][currentRect.lastCol] == this.draggedRect) { //Verificar se a chave do item que está na ultima posição é o mesmo que está movido
                //Limpa posição anterior na grid
                this.grid[currentRect.lastRow][currentRect.lastCol] = 0
                //Seta posição atual na grid
                this.grid[currentRect.row][currentRect.col] = this.draggedRect

                this.rects[this.draggedRect] = currentRect
                this.draggedRect = null
            }
        }
    }
    drawRect(rect: Rect, context: CanvasRenderingContext2D) {
        context.fillStyle = rect.color
        context.fillRect((rect.col * this.gridCellSize), (rect.row * this.gridCellSize), rect.width, rect.height)

    }
}