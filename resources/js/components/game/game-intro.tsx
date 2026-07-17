import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const INTRO_SECONDS = 5;

const FLOATERS = ['⚗️', '🧪', '🔬', '⚛️', '🧬', '💥', '✨', '🥼', '🧲', '🌡️'];

const GOOD_LUCK_LINES = [
    'May every bond be in your favor!',
    'Time to show your chemistry skills!',
    'Stay noble — like a gas! 😎',
    'You and this quiz? Great chemistry!',
    'Catalyze that brain of yours!',
    'React fast, name faster!',
    'No pressure… okay, maybe one atmosphere.',
    'Go get those carbons in line!',
];

/** Deterministic pseudo-random in [0, 1) so SSR and client agree. */
function seeded(i: number, salt: number): number {
    const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;

    return x - Math.floor(x);
}

/**
 * Full-screen 5-second hype screen shown when a solo game begins:
 * game mode + topic, a good-luck message, and a countdown to the start.
 */
export function GameIntro({
    modeTitle,
    topicName,
    playerName,
    onDone,
}: {
    modeTitle: string;
    topicName: string;
    playerName: string;
    onDone: () => void;
}) {
    // 4 → 3 → 2 → 1 → GO!, one beat each: exactly INTRO_SECONDS in total.
    const [secondsLeft, setSecondsLeft] = useState(INTRO_SECONDS - 1);
    const [line] = useState(
        () =>
            GOOD_LUCK_LINES[Math.floor(Math.random() * GOOD_LUCK_LINES.length)],
    );

    useEffect(() => {
        const timer = setTimeout(
            () => (secondsLeft > 0 ? setSecondsLeft((s) => s - 1) : onDone()),
            1000,
        );

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [secondsLeft]);

    return (
        <AnimatePresence>
            <motion.div
                key="game-intro"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-background"
            >
                {/* Ambient blobs */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                >
                    <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-game-purple/20 blur-3xl" />
                    <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-game-sky/20 blur-3xl" />
                </div>

                {/* Floating chemistry bits */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                >
                    {FLOATERS.map((emoji, i) => (
                        <motion.span
                            key={i}
                            initial={{ y: '110vh', opacity: 0 }}
                            animate={{ y: '-15vh', opacity: [0, 1, 1, 0] }}
                            transition={{
                                duration: 5 + seeded(i, 1) * 4,
                                delay: seeded(i, 2) * 2.5,
                                repeat: Infinity,
                                ease: 'linear',
                            }}
                            className="absolute text-3xl"
                            style={{ left: `${6 + seeded(i, 3) * 88}%` }}
                        >
                            {emoji}
                        </motion.span>
                    ))}
                </div>

                <div className="relative flex flex-col items-center gap-5 px-6 text-center">
                    <motion.div
                        animate={{ rotate: [0, -8, 8, -8, 0], y: [0, -6, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity }}
                        className="text-7xl"
                    >
                        🧪
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-display text-4xl font-extrabold text-foreground"
                    >
                        Get Ready!
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="flex flex-wrap items-center justify-center gap-2"
                    >
                        <span className="rounded-full bg-game-purple/25 px-4 py-1.5 text-sm font-bold text-foreground">
                            {modeTitle}
                        </span>
                        <span className="rounded-full bg-game-sky/25 px-4 py-1.5 text-sm font-bold text-foreground">
                            {topicName}
                        </span>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="max-w-sm text-base font-semibold text-foreground/70"
                    >
                        Good luck, {playerName}! {line}
                    </motion.p>

                    <motion.div
                        key={secondsLeft}
                        initial={{ scale: 1.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="font-display text-6xl font-extrabold text-game-lime tabular-nums"
                    >
                        {secondsLeft > 0 ? secondsLeft : 'GO!'}
                    </motion.div>
                </div>

                {/* Progress to launch */}
                <div className="absolute bottom-10 h-2 w-56 overflow-hidden rounded-full bg-foreground/10">
                    <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: INTRO_SECONDS, ease: 'linear' }}
                        className="h-full rounded-full bg-gradient-to-r from-game-purple to-game-sky"
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
