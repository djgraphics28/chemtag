import { motion } from 'framer-motion';
import { Flame, Volume2, VolumeX } from 'lucide-react';
import { GameProgressBar } from './game-progress-bar';
import { HeartsDisplay } from './hearts-display';
import { RadialTimer } from './radial-timer';
import { useCountUp } from '@/hooks/use-count-up';
import type { Progress, SessionState } from '@/types/game';

interface GameHudProps {
    session: SessionState;
    progress: Progress;
    secondsLeft: number;
    timeLimitSeconds: number;
    muted?: boolean;
    onToggleMuted?: () => void;
}

export function GameHud({ session, progress, secondsLeft, timeLimitSeconds, muted, onToggleMuted }: GameHudProps) {
    const displayScore = useCountUp(session.score);

    return (
        <header className="flex items-center gap-4 px-4 py-3">
            <RadialTimer secondsLeft={secondsLeft} total={timeLimitSeconds} size={56} strokeWidth={5} />

            <div className="flex flex-1 flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <HeartsDisplay lives={session.lives_remaining} />
                    <div className="flex items-center gap-3">
                        {session.streak_count >= 2 && (
                            <motion.span
                                key={session.streak_count}
                                initial={{ scale: 0.5 }}
                                animate={{ scale: [0.5, 1.35, 1] }}
                                transition={{ duration: 0.35 }}
                                className="flex items-center gap-1 text-xs font-bold text-game-warning"
                            >
                                <motion.span
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
                                >
                                    <Flame size={14} className="fill-game-warning" />
                                </motion.span>
                                {session.streak_count}x
                            </motion.span>
                        )}
                        <motion.span
                            key={session.score}
                            animate={session.score > 0 ? { scale: [1, 1.25, 1] } : undefined}
                            transition={{ duration: 0.3 }}
                            className="text-sm font-bold tabular-nums text-foreground"
                        >
                            {displayScore.toLocaleString()}
                        </motion.span>
                        {onToggleMuted && (
                            <button
                                type="button"
                                onClick={onToggleMuted}
                                aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
                                className="text-foreground/40 transition-colors hover:text-foreground"
                            >
                                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                            </button>
                        )}
                    </div>
                </div>
                <GameProgressBar answered={progress.answered} total={progress.total} />
            </div>
        </header>
    );
}
