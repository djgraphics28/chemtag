import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { AnswerResult } from '@/types/game';

interface AnswerFeedbackProps {
    result: AnswerResult | null;
}

export function AnswerFeedback({ result }: AnswerFeedbackProps) {
    return (
        <AnimatePresence>
            {result && (
                <motion.div
                    key={result.is_correct ? 'correct' : 'wrong'}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
                        result.is_correct
                            ? 'bg-game-correct/15 text-game-correct'
                            : 'bg-game-danger/15 text-game-danger'
                    }`}
                >
                    {result.is_correct ? (
                        <CheckCircle2 size={18} className="shrink-0" />
                    ) : (
                        <XCircle size={18} className="shrink-0" />
                    )}
                    <span>
                        {result.is_correct
                            ? `Correct! +${result.points_earned} pts`
                            : result.timed_out
                              ? "Time's up! No points earned."
                              : 'Wrong answer!'}
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
