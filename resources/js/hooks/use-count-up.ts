import { useEffect, useRef, useState } from 'react';

/** Animates a number towards `target` with an ease-out tween. */
export function useCountUp(target: number, durationMs = 600): number {
    const [display, setDisplay] = useState(target);
    const fromRef = useRef(target);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const from = fromRef.current;
        if (from === target) return;

        const startedAt = performance.now();

        const tick = (now: number) => {
            const t = Math.min(1, (now - startedAt) / durationMs);
            const eased = 1 - Math.pow(1 - t, 3);
            const value = Math.round(from + (target - from) * eased);
            setDisplay(value);

            if (t < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                fromRef.current = target;
            }
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(rafRef.current);
    }, [target, durationMs]);

    return display;
}
