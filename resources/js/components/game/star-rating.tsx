import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface StarRatingProps {
    stars: number;
    maxStars?: number;
    size?: number;
}

export function StarRating({ stars, maxStars = 3, size = 40 }: StarRatingProps) {
    return (
        <div className="flex items-center gap-2">
            {Array.from({ length: maxStars }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3 + i * 0.15, type: 'spring', stiffness: 260, damping: 20 }}
                >
                    <Star
                        size={size}
                        strokeWidth={1.5}
                        className={i < stars ? 'fill-game-primary text-game-primary' : 'text-white/20'}
                    />
                </motion.div>
            ))}
        </div>
    );
}
