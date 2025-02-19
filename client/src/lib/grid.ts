import Water from '../assets/water.png'
import Explosion from '../assets/explosion0.png'
import Splash from '../assets/Splash.png'
import Wave from '../assets/Wave.png'

export function createGrid(playerId: string, canvas: any, grid: any) {
    const backGround = new Image();
    backGround.src = Water
    const explosion = new Image()
    explosion.src = Explosion
    const splash = new Image()
    splash.src = Splash
    const wave = new Image()
    wave.src = Wave
    return {
        position: {
            x: 0,
            y: 0,
        },
        width: 400,
        height: 400,
        gridCellSize: 40,
        draggedRect: null,
        lineWidth: 1,
        rects: [],
        grid: grid,
        backGround: backGround,
        sprites: {
            explosion: explosion,
            splash: splash,
            wave: wave
        },
        canvas: canvas,
    }
}

export function draw(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, grid: any) {

    context.drawImage(grid.backGround, 0, 0, canvas.width, canvas.height);
    drawGrid(context, grid);

}

function drawGrid(context: CanvasRenderingContext2D, grid: any) {
    context.save();
    context.beginPath();
    context.lineWidth = grid.lineWidth;
    context.strokeStyle = 'green';

    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
            const hited = grid.grid[row][col].hited;
            const rectId = grid.grid[row][col].rectId;
            const rect = grid.rects[rectId];

            // Desenha a box (célula)
            context.strokeRect(col * grid.gridCellSize, row * grid.gridCellSize, grid.gridCellSize, grid.gridCellSize);
            if (hited && rectId == null) {
                context.drawImage(
                    grid.sprites.wave,           // A imagem da sprite sheet
                    0,                          // Coordenada X na sprite sheet
                    0,                          // Coordenada Y na sprite sheet
                    40,             // Largura da parte a ser desenhada
                    40,            // Altura da parte a ser desenhada
                    (col * grid.gridCellSize),  // Coordenada X no canvas
                    (row * grid.gridCellSize),  // Coordenada Y no canvas
                    40,             // Largura a ser desenhada no canvas
                    40              // Altura a ser desenhada no canvas
                );
            }

            if (rect) {
                if (rect.status == 'exploded') {
                    context.drawImage(
                        grid.sprites.explosion,           // A imagem da sprite sheet
                        0,                          // Coordenada X na sprite sheet
                        0,                          // Coordenada Y na sprite sheet
                        40,             // Largura da parte a ser desenhada
                        40,            // Altura da parte a ser desenhada
                        (rect.col * grid.gridCellSize),  // Coordenada X no canvas
                        (rect.row * grid.gridCellSize),  // Coordenada Y no canvas
                        40,             // Largura a ser desenhada no canvas
                        40              // Altura a ser desenhada no canvas
                    );
                } else {
                    context.fillStyle = 'red';
                    context.fillRect(
                        (rect.col * grid.gridCellSize),
                        (rect.row * grid.gridCellSize),
                        rect.width,
                        rect.height
                    );
                }
            }
        }
    }

    context.stroke();
    context.closePath();
    context.restore();
}

function drawRect(rect: Rect, context: CanvasRenderingContext2D, grid: any) {
    if (rect.status == 'exploded') {
        console.log('exploded')
        context.fillStyle = 'yellow'
    } else {
        context.fillStyle = rect.color

    }
    context.fillRect((rect.col * grid.gridCellSize), (rect.row * grid.gridCellSize), rect.width, rect.height)

}