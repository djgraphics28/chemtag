import { motion } from 'framer-motion';
import { MoleculeView } from '@/components/chem/molecule-view';
import { cn } from '@/lib/utils';
import type { AnswerResult, ChoiceData } from '@/types/game';

interface ChoiceGridProps {
    choices: ChoiceData[];
    selectedId: number | null;
    result: AnswerResult | null;
    disabled: boolean;
    onSelect: (id: number) => void;
}

export function ChoiceGrid({
    choices,
    selectedId,
    result,
    disabled,
    onSelect,
}: ChoiceGridProps) {
    function getVariant(choice: ChoiceData) {
        if (!result) {
            return selectedId === choice.id ? 'selected' : 'idle';
        }

        if (choice.id === result.correct_choice_id) {
            return 'correct';
        }

        if (choice.id === selectedId && !result.is_correct) {
            return 'wrong';
        }

        return 'dim';
    }

    const variantClasses: Record<string, string> = {
        idle: 'border-foreground/20 bg-foreground/5 text-foreground hover:border-game-primary/60 hover:bg-game-primary/10',
        selected: 'border-game-primary bg-game-primary/20 text-foreground',
        correct:
            'border-game-correct bg-game-correct/20 text-game-correct shadow-[0_0_24px_-4px_var(--color-game-correct)]',
        wrong: 'border-game-danger bg-game-danger/20 text-game-danger',
        dim: 'border-foreground/10 bg-foreground/5 text-foreground/30',
    };

    const variantMotion: Record<string, object | undefined> = {
        correct: { scale: [1, 1.08, 1] },
        wrong: { x: [0, -8, 8, -6, 6, -3, 0] },
    };

    return (
        <div className="grid grid-cols-2 gap-3">
            {choices.map((choice, i) => {
                const variant = getVariant(choice);
                const label = String.fromCharCode(65 + i);

                return (
                    <motion.button
                        key={choice.id}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            ...(variantMotion[variant] ?? {}),
                        }}
                        transition={{
                            opacity: { duration: 0.25, delay: i * 0.07 },
                            y: { duration: 0.25, delay: i * 0.07 },
                            scale: { duration: 0.45 },
                            x: { duration: 0.4 },
                        }}
                        whileHover={
                            !disabled && variant === 'idle'
                                ? { scale: 1.03 }
                                : undefined
                        }
                        whileTap={
                            !disabled && variant === 'idle'
                                ? { scale: 0.96 }
                                : undefined
                        }
                        disabled={disabled}
                        onClick={() => onSelect(choice.id)}
                        className={cn(
                            'flex min-h-[80px] items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors duration-200',
                            variantClasses[variant],
                            !disabled && variant === 'idle' && 'cursor-pointer',
                            disabled && 'cursor-not-allowed',
                        )}
                    >
                        <span className="shrink-0 text-xs font-bold opacity-60">
                            {label}
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            {choice.choice_smiles ? (
                                <MoleculeView
                                    smiles={choice.choice_smiles}
                                    width={220}
                                    height={120}
                                    className="pointer-events-none"
                                />
                            ) : choice.choice_image_path ? (
                                <img
                                    src={choice.choice_image_path}
                                    alt={
                                        choice.choice_text ?? `Choice ${label}`
                                    }
                                    className="h-12 w-auto object-contain"
                                />
                            ) : (
                                <span
                                    className={cn(
                                        'text-sm leading-snug font-medium',
                                        variant === 'wrong' && 'line-through',
                                    )}
                                >
                                    {choice.choice_text}
                                </span>
                            )}
                            {choice.id === selectedId &&
                                result?.choice_feedback?.[choice.id] && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.25 }}
                                        className={cn(
                                            'rounded-lg border px-2.5 py-1.5 text-xs leading-snug font-normal italic no-underline',
                                            choice.id ===
                                                result.correct_choice_id
                                                ? 'border-game-correct/40 bg-game-correct/10 text-game-correct'
                                                : 'border-game-danger/40 bg-game-danger/10 text-game-danger',
                                        )}
                                    >
                                        {result.choice_feedback[choice.id]}
                                    </motion.p>
                                )}
                        </div>
                    </motion.button>
                );
            })}
        </div>
    );
}
