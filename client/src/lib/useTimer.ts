import { useEffect, useState } from "react";



export const useTimer = () => {
    const [time, setTime] = useState(0);
    const [direction, setDirection] = useState<"up" | "down">("down");
    const [isActive, setIsActive] = useState(false);
    const [onComplete, setOnComplete] = useState<(() => void) | undefined>();

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isActive) {
            interval = setInterval(() => {
                setTime((prev) => {
                    const newTime = direction === "down" ? prev - 1 : prev + 1;

                    // Handle completion for countdown
                    if (direction === "down" && newTime <= 0) {
                        setIsActive(false);
                        onComplete?.();
                        return 0;
                    }

                    return newTime;
                });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, direction, onComplete]);

    const start = (initialTime: number, dir: "up" | "down", onComp?: () => void) => {
        setTime(initialTime);
        setDirection(dir);
        if (onComp) {
            setOnComplete(() => onComp); // Save the onComplete callback
        }
        setIsActive(true);
    };

    const pause = () => setIsActive(false);

    const reset = () => {
        setIsActive(false);
        setTime(direction === "down" ? 0 : 0);
    };

    // Format time to MM:SS
    const formatTime = () => {
        const absTime = Math.abs(time);
        const minutes = Math.floor(absTime / 60);
        const seconds = absTime % 60;
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    return {
        time,
        formattedTime: formatTime(),
        isActive,
        start,
        pause,
        reset,
    };
};