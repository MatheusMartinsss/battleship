import { useEffect, useState } from "react"

export const Timer = () => {
    const [seconds, setSeconds] = useState(0)
    const [isActive, setIsActive] = useState(false)

    useEffect(() => {
        let interval = null;
        if (isActive) {
            interval = setInterval(() => {
                setSeconds(seconds => seconds + 1);
            }, 1000);
        } else if (!isActive && seconds !== 0) {
            clearInterval(interval);
        }
        if (interval) {
            return () => clearInterval(interval);
        }
    }, [isActive, seconds])

    const startTimer = () => {
        setIsActive(true);
    };

    const stopTimer = () => {
        setIsActive(false);
    };
}