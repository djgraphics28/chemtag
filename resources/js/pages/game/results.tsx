import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Home, RefreshCw, Trophy } from 'lucide-react';
import { ConfettiBurst } from '@/components/game/confetti-burst';
import { StarRating } from '@/components/game/star-rating';
import { XpBadge } from '@/components/game/xp-badge';
import { Button } from '@/components/ui/button';
import { useCountUp } from '@/hooks/use-count-up';
import type { SessionState } from '@/types/game';

interface ResultsProps {
    session: SessionState;
    stats: {
        correct_count: number;
        total_questions: number;
        accuracy: number;
        stars: number;
        xp_earned: number;
    };
}

export default function Results({ session, stats }: ResultsProps) {
    const isCompleted = session.status === 'completed';
    const displayScore = useCountUp(session.score, 1200);

    function handlePlayAgain() {
        router.post('/game/sessions', {
            game_mode_id: session.game_mode.id,
            topic_id: session.topic.id,
        });
    }

    return (
        <>
            <Head title={isCompleted ? 'Topic Complete!' : 'Game Over'} />

            <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
                {isCompleted && <ConfettiBurst mode="rain" count={60} />}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35 }}
                    className="w-full max-w-sm space-y-8 text-center"
                >
                    {/* Title */}
                    <div>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                                delay: 0.1,
                                type: 'spring',
                                stiffness: 200,
                            }}
                            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-game-primary/20"
                        >
                            <Trophy
                                size={40}
                                className={
                                    isCompleted
                                        ? 'text-game-primary'
                                        : 'text-foreground/40'
                                }
                            />
                        </motion.div>
                        <h1 className="font-display text-4xl font-bold text-foreground">
                            {isCompleted ? 'Topic Complete!' : 'Game Over'}
                        </h1>
                        <p className="mt-1 text-foreground/50">
                            {session.topic.name} · {session.game_mode.title}
                        </p>
                    </div>

                    {/* Stars */}
                    <div className="flex justify-center">
                        <StarRating stars={stats.stars} size={48} />
                    </div>

                    {/* Score card */}
                    <div className="space-y-4 rounded-3xl border border-foreground/10 bg-foreground/5 p-6">
                        <div className="flex justify-center">
                            <XpBadge xp={stats.xp_earned} />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <Stat
                                label="Score"
                                value={displayScore.toLocaleString()}
                            />
                            <Stat
                                label="Accuracy"
                                value={`${stats.accuracy}%`}
                            />
                            <Stat
                                label="Correct"
                                value={`${stats.correct_count}/${stats.total_questions}`}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                        <Button
                            onClick={handlePlayAgain}
                            className="w-full bg-game-purple font-bold text-game-navy hover:bg-game-purple/90"
                            size="lg"
                        >
                            <RefreshCw size={16} className="mr-2" />
                            Play Again
                        </Button>
                        <Button
                            asChild
                            variant="ghost"
                            size="lg"
                            className="w-full text-foreground/60 hover:text-foreground"
                        >
                            <Link href="/game/topics">
                                <Home size={16} className="mr-2" />
                                Topic Map
                            </Link>
                        </Button>
                    </div>
                </motion.div>
            </div>
        </>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col items-center">
            <span className="font-display text-2xl font-bold text-foreground">
                {value}
            </span>
            <span className="text-xs text-foreground/40">{label}</span>
        </div>
    );
}
