import { motion } from 'framer-motion';

interface GuessMyNameHeaderProps {
    title: string;
    questionNumber: number;
    totalQuestions: number;
    score: number;
}

/**
 * Worksheet-style banner for the "Guess My Name" (pattern_clue) mode:
 * a bold title card, instructions, and Question/Score badges.
 */
export function GuessMyNameHeader({
    title,
    questionNumber,
    totalQuestions,
    score,
}: GuessMyNameHeaderProps) {
    return (
        <div className="flex w-full flex-col items-center gap-3">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border-[3px] border-foreground/80 bg-game-sky px-6 py-3 text-center shadow-[0_3px_0_0_rgb(0_0_0_/_0.2)]"
            >
                <h2 className="font-display text-lg font-extrabold tracking-wide text-game-navy uppercase sm:text-xl">
                    {title}
                </h2>
            </motion.div>

            <p className="max-w-sm text-center text-xs leading-snug font-medium text-foreground/60">
                Analyze the four structures and find the common clue to spell
                out the substituent or parent name!
            </p>

            <div className="flex w-full max-w-sm items-center justify-between gap-3">
                <span className="rounded-xl border-2 border-foreground/70 bg-game-coral px-4 py-1.5 text-xs font-bold tracking-wide text-game-navy shadow-[0_2px_0_0_rgb(0_0_0_/_0.15)]">
                    QUESTION {questionNumber}/{totalQuestions}
                </span>
                <span className="rounded-xl border-2 border-foreground/70 bg-game-coral px-4 py-1.5 text-xs font-bold tracking-wide text-game-navy shadow-[0_2px_0_0_rgb(0_0_0_/_0.15)] tabular-nums">
                    SCORE: {score.toLocaleString()}
                </span>
            </div>
        </div>
    );
}
