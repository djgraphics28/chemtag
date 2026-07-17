import { router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MoleculeView } from '@/components/chem/molecule-view';
import { AnswerFeedback } from '@/components/game/answer-feedback';
import { ChoiceGrid } from '@/components/game/choice-grid';
import { ClueImageGrid } from '@/components/game/clue-image-grid';
import { ClueTileGrid } from '@/components/game/clue-tile-grid';
import { ConfettiBurst } from '@/components/game/confetti-burst';
import { GameHud } from '@/components/game/game-hud';
import { ScorePopup } from '@/components/game/score-popup';
import { WordBuilder } from '@/components/game/word-builder';
import { useCountdown } from '@/hooks/use-countdown';
import { useGameSounds } from '@/hooks/use-game-sounds';
import { apiFetch } from '@/lib/api-fetch';
import type {
    AnswerResult,
    ChoiceData,
    Progress,
    QuestionData,
    SessionState,
} from '@/types/game';

interface PlayProps {
    session: SessionState;
    question: QuestionData;
    choices: ChoiceData[];
    progress: Progress;
}

export default function Play({
    session: initialSession,
    question,
    choices,
    progress,
}: PlayProps) {
    const [session, setSession] = useState(initialSession);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [result, setResult] = useState<AnswerResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shake, setShake] = useState(0);
    const startedAtRef = useRef(Date.now());

    const sounds = useGameSounds();
    const soundsRef = useRef(sounds);
    soundsRef.current = sounds;

    const handleTimeout = useCallback(async () => {
        if (isSubmitting || result) {
            return;
        }

        await submitAnswer(null);
    }, [isSubmitting, result]);

    const { secondsLeft, start, stop, reset } = useCountdown(
        question.time_limit_seconds,
        {
            onExpire: handleTimeout,
        },
    );

    useEffect(() => {
        startedAtRef.current = Date.now();
        reset(question.time_limit_seconds);
        setSelectedId(null);
        setResult(null);
        setIsSubmitting(false);
        start();
    }, [question.id]);

    // Urgency tick during the last 5 seconds
    useEffect(() => {
        if (secondsLeft > 0 && secondsLeft <= 5 && !result && !isSubmitting) {
            soundsRef.current.playTick();
        }
    }, [secondsLeft, result, isSubmitting]);

    async function submitAnswer(choiceId: number | null, word?: string) {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        stop();

        const timeTaken = Math.round(
            (Date.now() - startedAtRef.current) / 1000,
        );

        try {
            const data = await apiFetch<AnswerResult>(
                `/game/sessions/${session.id}/answers`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        choice_id: choiceId,
                        word: word ?? null,
                        time_taken_seconds: Math.min(
                            timeTaken,
                            question.time_limit_seconds,
                        ),
                    }),
                },
            );

            setResult(data);
            setSession((prev) => ({
                ...prev,
                score: data.score,
                lives_remaining: data.lives_remaining,
                streak_count: data.streak_count,
                status: data.session_status,
            }));

            if (data.is_correct) {
                soundsRef.current.playCorrect(data.streak_count);
            } else {
                setShake((s) => s + 1);

                if (data.timed_out) {
                    soundsRef.current.playTimeout();
                } else {
                    soundsRef.current.playWrong();
                }
            }

            if (data.session_status === 'completed') {
                soundsRef.current.playTopicComplete();
            } else if (data.session_status === 'failed') {
                soundsRef.current.playGameOver();
            }

            const hasFeedback =
                Object.keys(data.choice_feedback ?? {}).length > 0;
            const readingTime = hasFeedback ? 4000 : 1600;

            setTimeout(() => {
                if (data.session_status !== 'in_progress') {
                    router.visit(`/game/sessions/${session.id}/results`);
                } else {
                    router.visit(`/game/sessions/${session.id}/play`, {
                        preserveScroll: false,
                    });
                }
            }, readingTime);
        } catch {
            setIsSubmitting(false);
            start();
        }
    }

    function handleSelect(choiceId: number) {
        if (isSubmitting || result) {
            return;
        }

        setSelectedId(choiceId);
        submitAnswer(choiceId);
    }

    async function requestHint(position: number) {
        try {
            const data = await apiFetch<{
                position: number;
                letter: string;
                cost: number;
                score: number;
            }>(`/game/sessions/${session.id}/hint`, {
                method: 'POST',
                body: JSON.stringify({ position }),
            });

            setSession((prev) => ({ ...prev, score: data.score }));

            return { position: data.position, letter: data.letter };
        } catch {
            return null;
        }
    }

    const isUrgent = secondsLeft > 0 && secondsLeft <= 5 && !result;

    return (
        <motion.div
            key={shake}
            animate={shake > 0 ? { x: [0, -12, 12, -8, 8, -4, 0] } : undefined}
            transition={{ duration: 0.45 }}
            className="relative flex min-h-screen flex-col"
        >
            {/* Red vignette when time is almost up */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 z-10 transition-opacity duration-500"
                style={{
                    opacity: isUrgent ? 1 : 0,
                    boxShadow:
                        'inset 0 0 120px 30px oklch(0.65 0.22 24.5 / 0.35)',
                    animation: isUrgent
                        ? 'ct-timer-pulse 1s ease-in-out infinite'
                        : undefined,
                }}
            />

            <GameHud
                session={session}
                progress={progress}
                secondsLeft={secondsLeft}
                timeLimitSeconds={question.time_limit_seconds}
                muted={sounds.muted}
                onToggleMuted={sounds.toggleMuted}
            />

            <main className="relative mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6">
                {/* Celebration overlays */}
                {result?.is_correct && (
                    <ConfettiBurst key={`confetti-${question.id}`} />
                )}
                <ScorePopup
                    points={result?.is_correct ? result.points_earned : null}
                    streak={result?.streak_count ?? 0}
                />

                {/* Prompt */}
                <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: -14, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center gap-4 rounded-3xl border border-foreground/10 bg-foreground/5 px-6 py-8"
                >
                    {question.clue_image_urls?.length > 0 ? (
                        <ClueImageGrid urls={question.clue_image_urls} />
                    ) : question.letters?.length && question.prompt_smiles ? (
                        <ClueTileGrid smiles={question.prompt_smiles} />
                    ) : null}
                    {question.prompt_smiles && !question.letters?.length && (
                        <MoleculeView smiles={question.prompt_smiles} />
                    )}
                    {question.prompt_image_path && (
                        <img
                            src={question.prompt_image_path}
                            alt="Question prompt"
                            className="max-h-48 w-auto rounded-xl object-contain"
                        />
                    )}
                    {question.prompt_text && (
                        <p className="text-center text-lg leading-snug font-semibold text-foreground">
                            {question.prompt_text}
                        </p>
                    )}
                    <div className="text-xs font-medium text-foreground/40">
                        {question.points} pts · {session.game_mode.title}
                    </div>
                </motion.div>

                {question.letters?.length ? (
                    <WordBuilder
                        letters={question.letters}
                        wordLength={question.word_length ?? 0}
                        disabled={!!result || isSubmitting}
                        status={
                            result
                                ? result.is_correct
                                    ? 'correct'
                                    : 'wrong'
                                : 'idle'
                        }
                        correctWord={result?.correct_word}
                        onSubmit={(word) => submitAnswer(null, word)}
                        onHint={requestHint}
                    />
                ) : (
                    <ChoiceGrid
                        choices={choices}
                        selectedId={selectedId}
                        result={result}
                        disabled={!!result || isSubmitting}
                        onSelect={handleSelect}
                    />
                )}

                <AnswerFeedback result={result} />
            </main>
        </motion.div>
    );
}
