import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface WordBuilderProps {
    /** Shuffled letter pool (answer letters + decoys). */
    letters: string[];
    /** Number of slots to fill. */
    wordLength: number;
    disabled?: boolean;
    /** 'correct' | 'wrong' colouring after the server verdict. */
    status?: 'idle' | 'correct' | 'wrong';
    /** Revealed answer, shown when the guess was wrong. */
    correctWord?: string | null;
    /** Called once when every slot is filled. */
    onSubmit: (word: string) => void;
}

/**
 * 4-Pics-1-Word style answer input: tap letter tiles to fill the slots;
 * the word auto-submits when the last slot is filled.
 */
export function WordBuilder({
    letters,
    wordLength,
    disabled = false,
    status = 'idle',
    correctWord,
    onSubmit,
}: WordBuilderProps) {
    // Each slot holds the index of the pool tile placed there (or null).
    const [slots, setSlots] = useState<(number | null)[]>(
        Array(wordLength).fill(null),
    );
    const [submitted, setSubmitted] = useState(false);

    const usedTileIndexes = new Set(
        slots.filter((s): s is number => s !== null),
    );
    const interactive = !disabled && !submitted;

    function placeTile(tileIndex: number) {
        if (!interactive || usedTileIndexes.has(tileIndex)) {
            return;
        }

        const firstEmpty = slots.indexOf(null);

        if (firstEmpty === -1) {
            return;
        }

        const next = [...slots];
        next[firstEmpty] = tileIndex;
        setSlots(next);

        // Auto-submit the moment the last slot is filled
        if (next.every((s) => s !== null)) {
            setSubmitted(true);
            onSubmit(next.map((s) => letters[s as number]).join(''));
        }
    }

    function clearSlot(slotIndex: number) {
        if (!interactive) {
            return;
        }

        setSlots((prev) => {
            const next = [...prev];
            next[slotIndex] = null;

            return next;
        });
    }

    function clearAll() {
        if (!interactive) {
            return;
        }

        setSlots(Array(wordLength).fill(null));
    }

    return (
        <div className="flex flex-col items-center gap-5">
            {/* Answer slots */}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
                {slots.map((tileIndex, i) => (
                    <motion.button
                        key={i}
                        type="button"
                        whileTap={
                            tileIndex !== null ? { scale: 0.9 } : undefined
                        }
                        onClick={() => clearSlot(i)}
                        className={cn(
                            'flex h-11 w-9 items-center justify-center rounded-lg border-2 font-display text-lg font-extrabold shadow-sm transition-colors sm:h-12 sm:w-10',
                            status === 'correct'
                                ? 'border-game-correct bg-game-correct/20 text-game-correct'
                                : status === 'wrong'
                                  ? 'border-game-danger bg-game-danger/20 text-game-danger'
                                  : tileIndex !== null
                                    ? 'border-game-primary bg-white text-foreground'
                                    : 'border-foreground/15 bg-foreground/5 text-transparent shadow-none',
                        )}
                    >
                        {tileIndex !== null ? letters[tileIndex] : '·'}
                    </motion.button>
                ))}
            </div>

            {status === 'wrong' && correctWord && (
                <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm font-semibold text-foreground/60"
                >
                    Answer:{' '}
                    <span className="font-display font-bold tracking-widest text-game-correct">
                        {correctWord}
                    </span>
                </motion.p>
            )}

            {/* Letter keyboard + clear button */}
            <div className="flex items-center justify-center gap-2">
                <div className="flex max-w-xs flex-wrap items-center justify-center gap-1.5 sm:max-w-sm">
                    {letters.map((letter, tileIndex) => {
                        const used = usedTileIndexes.has(tileIndex);

                        return (
                            <motion.button
                                key={tileIndex}
                                type="button"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: tileIndex * 0.03 }}
                                whileTap={
                                    !used && interactive
                                        ? { scale: 0.88 }
                                        : undefined
                                }
                                disabled={used || !interactive}
                                onClick={() => placeTile(tileIndex)}
                                className={cn(
                                    'flex h-10 w-9 items-center justify-center rounded-lg border-2 font-display text-base font-bold transition-all sm:h-11 sm:w-10',
                                    used
                                        ? 'border-transparent bg-foreground/5 text-transparent'
                                        : 'cursor-pointer border-foreground/15 bg-white text-foreground shadow-[0_2px_0_0_rgb(0_0_0_/_0.08)] hover:-translate-y-0.5 hover:border-game-primary/60',
                                    !interactive && 'cursor-not-allowed',
                                )}
                            >
                                {letter}
                            </motion.button>
                        );
                    })}
                </div>

                <motion.button
                    type="button"
                    whileTap={interactive ? { scale: 0.9 } : undefined}
                    disabled={!interactive}
                    onClick={clearAll}
                    aria-label="Clear all letters"
                    className="flex h-10 w-10 items-center justify-center self-end rounded-lg bg-game-correct text-white shadow-[0_2px_0_0_rgb(0_0_0_/_0.15)] transition-all hover:brightness-105 disabled:opacity-40 sm:h-11 sm:w-11"
                >
                    <Trash2 size={16} />
                </motion.button>
            </div>
        </div>
    );
}
