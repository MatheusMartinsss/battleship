import { useEffect, useState } from "react";

export const useTime = () => {
    const [time, setTimeLeft] = useState(0)

    useEffect(() => {
        if (!time) return

        const intervalId = setInterval(() => {
            setTimeLeft(time - 1)
        }, 1000)

        return () => clearInterval(intervalId)

    }, [time])

    const startCount = (seconds: number) => {
        setTimeLeft(seconds)
    }
    return {
        time,
        startCount
    }
};