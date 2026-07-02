import { useCallback, useEffect, useRef, useState } from 'react';

interface UseCountdownOptions {
    onExpire?: () => void;
}

export function useCountdown(initialSeconds: number, options: UseCountdownOptions = {}) {
    const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const onExpireRef = useRef(options.onExpire);
    onExpireRef.current = options.onExpire;

    const clear = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const start = useCallback(() => {
        setIsRunning(true);
    }, []);

    const stop = useCallback(() => {
        clear();
        setIsRunning(false);
    }, [clear]);

    const reset = useCallback((seconds?: number) => {
        clear();
        setIsRunning(false);
        setSecondsLeft(seconds ?? initialSeconds);
    }, [clear, initialSeconds]);

    useEffect(() => {
        if (!isRunning) {
            return;
        }

        intervalRef.current = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current!);
                    intervalRef.current = null;
                    setIsRunning(false);
                    onExpireRef.current?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return clear;
    }, [isRunning, clear]);

    const progress = initialSeconds > 0 ? secondsLeft / initialSeconds : 0;

    return { secondsLeft, progress, isRunning, start, stop, reset };
}
