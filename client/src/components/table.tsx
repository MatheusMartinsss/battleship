import { useEffect, useRef } from "react";

interface CanvasProps {
    gameLoop: (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void
    height?: number;
    width?: number;
}

export default function Canvas({ height = 500, width = 500, gameLoop }: CanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef<number>(0);

    useEffect(() => {
        function draw(context: CanvasRenderingContext2D) {
            if (context) {
                context.fillStyle = 'black'
                context.fillRect(0, 0, height, width);
                if (canvasRef.current) {
                    gameLoop(context, canvasRef.current)
                }
                frameRef.current = requestAnimationFrame(() => draw(context));
            }
        }
        if (canvasRef.current) {
            const context = canvasRef.current.getContext("2d");

            if (context) {
                context.canvas.height = height;
                context.canvas.width = width;

                frameRef.current = requestAnimationFrame(() => draw(context));
            }
        }
        return () => cancelAnimationFrame(frameRef.current);
    }, [height, width]);

    return <canvas ref={canvasRef} />;
}