import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

interface HeartsDisplayProps {
    lives: number;
    maxLives?: number;
}

export function HeartsDisplay({ lives, maxLives = 3 }: HeartsDisplayProps) {
    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: maxLives }).map((_, i) => {
                const filled = i < lives;

                return (
                    <motion.span
                        key={i}
                        animate={
                            filled
                                ? { scale: 1, rotate: 0 }
                                : { scale: [1.4, 0.8, 1], rotate: [0, -18, 0] }
                        }
                        transition={{ duration: 0.45 }}
                    >
                        <Heart
                            size={20}
                            className={filled ? 'fill-game-danger text-game-danger' : 'text-foreground/20'}
                            strokeWidth={1.5}
                        />
                    </motion.span>
                );
            })}
        </div>
    );
}
