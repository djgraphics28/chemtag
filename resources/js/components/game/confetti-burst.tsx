import { motion } from 'framer-motion';
import { useMemo } from 'react';

const COLORS = [
    'var(--color-game-primary)',
    'var(--color-game-correct)',
    'var(--color-game-warning)',
    'var(--color-game-sky, #7dd3fc)',
    '#f472b6',
];

interface ConfettiBurstProps {
    /** Re-render with a new key to fire again */
    count?: number;
    /** 'burst' explodes from center; 'rain' falls from the top of the container */
    mode?: 'burst' | 'rain';
}

export function ConfettiBurst({ count = 24, mode = 'burst' }: ConfettiBurstProps) {
    const pieces = useMemo(
        () =>
            Array.from({ length: count }).map((_, i) => ({
                id: i,
                color: COLORS[i % COLORS.length],
                angle: (i / count) * Math.PI * 2 + Math.random() * 0.5,
                distance: 70 + Math.random() * 110,
                size: 5 + Math.random() * 6,
                rotate: Math.random() * 540 - 270,
                delay: mode === 'rain' ? Math.random() * 1.2 : Math.random() * 0.08,
                xStart: Math.random() * 100,
                duration: mode === 'rain' ? 2.2 + Math.random() * 1.6 : 0.7 + Math.random() * 0.4,
                round: Math.random() > 0.5,
            })),
        [count, mode],
    );

    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            {pieces.map((p) =>
                mode === 'burst' ? (
                    <motion.span
                        key={p.id}
                        initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
                        animate={{
                            x: Math.cos(p.angle) * p.distance,
                            y: Math.sin(p.angle) * p.distance + 40,
                            opacity: 0,
                            rotate: p.rotate,
                            scale: 0.6,
                        }}
                        transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
                        className="absolute left-1/2 top-1/2"
                        style={{
                            width: p.size,
                            height: p.size * (p.round ? 1 : 0.45),
                            background: p.color,
                            borderRadius: p.round ? '50%' : '2px',
                        }}
                    />
                ) : (
                    <motion.span
                        key={p.id}
                        initial={{ y: '-10%', opacity: 1, rotate: 0 }}
                        animate={{ y: '110vh', opacity: [1, 1, 0.8, 0], rotate: p.rotate * 2 }}
                        transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
                        className="absolute"
                        style={{
                            left: `${p.xStart}%`,
                            top: 0,
                            width: p.size,
                            height: p.size * (p.round ? 1 : 0.45),
                            background: p.color,
                            borderRadius: p.round ? '50%' : '2px',
                        }}
                    />
                ),
            )}
        </div>
    );
}
