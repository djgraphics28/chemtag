import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { AnswerResult, ChoiceData } from '@/types/game';

interface ChoiceGridProps {
    choices: ChoiceData[];
    selectedId: number | null;
    result: AnswerResult | null;
    disabled: boolean;
    onSelect: (id: number) => void;
}

export function ChoiceGrid({ choices, selectedId, result, disabled, onSelect }: ChoiceGridProps) {
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
        idle: 'border-white/20 bg-white/5 text-white hover:border-game-primary/60 hover:bg-game-primary/10',
        selected: 'border-game-primary bg-game-primary/20 text-white',
        correct: 'border-game-correct bg-game-correct/20 text-game-correct shadow-[0_0_24px_-4px_var(--color-game-correct)]',
        wrong: 'border-game-danger bg-game-danger/20 text-game-danger line-through',
        dim: 'border-white/10 bg-white/5 text-white/30',
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
                        animate={{ opacity: 1, y: 0, ...(variantMotion[variant] ?? {}) }}
                        transition={{
                            opacity: { duration: 0.25, delay: i * 0.07 },
                            y: { duration: 0.25, delay: i * 0.07 },
                            scale: { duration: 0.45 },
                            x: { duration: 0.4 },
                        }}
                        whileHover={!disabled && variant === 'idle' ? { scale: 1.03 } : undefined}
                        whileTap={!disabled && variant === 'idle' ? { scale: 0.96 } : undefined}
                        disabled={disabled}
                        onClick={() => onSelect(choice.id)}
                        className={cn(
                            'flex min-h-[80px] items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors duration-200',
                            variantClasses[variant],
                            !disabled && variant === 'idle' && 'cursor-pointer',
                            disabled && 'cursor-not-allowed',
                        )}
                    >
                        <span className="shrink-0 text-xs font-bold opacity-60">{label}</span>
                        {choice.choice_image_path ? (
                            <img
                                src={choice.choice_image_path}
                                alt={choice.choice_text ?? `Choice ${label}`}
                                className="h-12 w-auto object-contain"
                            />
                        ) : (
                            <span className="text-sm font-medium leading-snug">{choice.choice_text}</span>
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
}
