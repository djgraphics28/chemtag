import { AnimatePresence, motion } from 'framer-motion';

const COMBO_LABELS: Record<number, string> = {
    2: 'Combo x2!',
    3: 'Combo x3! 🔥',
    4: 'On Fire! 🔥',
    5: 'Unstoppable! ⚡',
};

function comboLabel(streak: number): string | null {
    if (streak < 2) return null;
    return COMBO_LABELS[Math.min(streak, 5)] ?? 'Legendary! 🏆';
}

interface ScorePopupProps {
    /** Points from the last correct answer; null hides the popup */
    points: number | null;
    streak: number;
}

export function ScorePopup({ points, streak }: ScorePopupProps) {
    const label = comboLabel(streak);

    return (
        <div className="pointer-events-none absolute inset-x-0 top-1/4 z-20 flex flex-col items-center gap-1" aria-hidden>
            <AnimatePresence>
                {points !== null && points > 0 && (
                    <motion.span
                        key={`pts-${points}-${streak}`}
                        initial={{ y: 16, opacity: 0, scale: 0.7 }}
                        animate={{ y: -34, opacity: [0, 1, 1, 0], scale: [0.7, 1.25, 1, 1] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="font-display text-4xl font-extrabold text-game-correct drop-shadow-[0_0_14px_var(--color-game-correct)]"
                    >
                        +{points}
                    </motion.span>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {points !== null && points > 0 && label && (
                    <motion.span
                        key={`combo-${streak}`}
                        initial={{ scale: 0, rotate: -8 }}
                        animate={{ scale: [0, 1.3, 1], rotate: 0, opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 1.4, ease: 'easeOut' }}
                        className="font-display text-lg font-bold text-game-warning drop-shadow-[0_0_10px_var(--color-game-warning)]"
                    >
                        {label}
                    </motion.span>
                )}
            </AnimatePresence>
        </div>
    );
}
