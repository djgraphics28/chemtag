import { Head, Link, router, usePage } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Check,
    Copy,
    Crown,
    DoorOpen,
    Play,
    Shield,
    Swords,
    Users,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MoleculeView } from '@/components/chem/molecule-view';
import { ClueImageGrid } from '@/components/game/clue-image-grid';
import { ClueTileGrid } from '@/components/game/clue-tile-grid';
import { ConfettiBurst } from '@/components/game/confetti-burst';
import { WordBuilder } from '@/components/game/word-builder';
import { Button } from '@/components/ui/button';
import { useCountUp } from '@/hooks/use-count-up';
import { useGameSounds } from '@/hooks/use-game-sounds';
import { apiFetch } from '@/lib/api-fetch';
import { battleColor } from '@/lib/battle-colors';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────
type Team = 'red' | 'blue';

interface BattlePlayer {
    user_id: number;
    name: string;
    username: string;
    avatar_path: string | null;
    team: Team | null;
    score: number;
    is_ready: boolean;
    is_host: boolean;
}

interface ScoreRow {
    user_id: number;
    name: string;
    username: string;
    avatar_path: string | null;
    team: Team | null;
    score: number;
    is_host: boolean;
}

const teamStyles: Record<
    Team,
    { label: string; emoji: string; panel: string; text: string; dot: string }
> = {
    red: {
        label: 'Team Red',
        emoji: '🔴',
        panel: 'border-game-coral/60 bg-game-coral/10',
        text: 'text-game-danger',
        dot: 'bg-game-coral',
    },
    blue: {
        label: 'Team Blue',
        emoji: '🔵',
        panel: 'border-game-sky/60 bg-game-sky/10',
        text: 'text-sky-600 dark:text-game-sky',
        dot: 'bg-game-sky',
    },
};

function teamTotal(scoreboard: ScoreRow[], team: Team): number {
    return scoreboard
        .filter((row) => row.team === team)
        .reduce((sum, row) => sum + row.score, 0);
}

interface RoundPayload {
    round_number: number;
    total_rounds: number;
    starts_at: string | null;
    ends_at: string | null;
    server_now: string;
    has_answered: boolean;
    answered_count: number;
    question: {
        id: number;
        prompt_text: string | null;
        prompt_image_path: string | null;
        prompt_smiles: string | null;
        clue_image_urls: string[];
        word_length: number | null;
        letters: string[] | null;
        points: number;
        time_limit_seconds: number;
    };
    choices: {
        id: number;
        choice_text: string | null;
        choice_image_path: string | null;
        choice_smiles: string | null;
    }[];
}

interface RoundEndedEvent {
    roundNumber: number;
    correctChoiceId: number;
    explanation: string | null;
    choiceFeedback: Record<number, string>;
    roundResults: {
        user_id: number;
        name: string;
        is_correct: boolean;
        points_earned: number;
        time_taken_ms: number;
    }[];
    scoreboard: ScoreRow[];
    nextRoundNumber: number | null;
    nextRoundStartsAt: string | null;
    isFinal: boolean;
}

interface RoomProps {
    room: {
        code: string;
        name: string | null;
        color: string;
        battle_type: 'single' | 'team';
        status: 'waiting' | 'in_progress' | 'finished';
        host_id: number;
        max_players: number;
        game_mode: { code: string; title: string };
        topic: { name: string };
        total_rounds: number;
    };
    players: BattlePlayer[];
    scoreboard: ScoreRow[] | null;
    current_round: RoundPayload | null;
}

type Phase = 'waiting' | 'countdown' | 'question' | 'round_result' | 'finished';

// ─── Page ────────────────────────────────────────────────────────
export default function BattleRoom({
    room,
    players: initialPlayers,
    scoreboard: initialScoreboard,
    current_round,
}: RoomProps) {
    const { auth } = usePage<{ auth: { user: { id: number } } }>().props;
    const myId = auth.user.id;
    const isHost = room.host_id === myId;

    const [players, setPlayers] = useState<BattlePlayer[]>(initialPlayers);
    const [onlineIds, setOnlineIds] = useState<number[]>([]);
    const [phase, setPhase] = useState<Phase>(
        room.status === 'finished'
            ? 'finished'
            : room.status === 'in_progress'
              ? 'countdown'
              : 'waiting',
    );
    const [round, setRound] = useState<RoundPayload | null>(current_round);
    const [countdown, setCountdown] = useState(0);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [myResult, setMyResult] = useState<{
        is_correct: boolean;
        points_earned: number;
        correct_word?: string | null;
    } | null>(null);
    const [answeredCount, setAnsweredCount] = useState(
        current_round?.answered_count ?? 0,
    );
    const [roundEnd, setRoundEnd] = useState<RoundEndedEvent | null>(null);
    const [scoreboard, setScoreboard] = useState<ScoreRow[]>(
        initialScoreboard ?? [],
    );
    const [copied, setCopied] = useState(false);

    const sounds = useGameSounds();
    const soundsRef = useRef(sounds);
    soundsRef.current = sounds;

    const clockOffsetRef = useRef(0); // serverNow - clientNow (ms)
    const timersRef = useRef<ReturnType<typeof setInterval>[]>([]);
    const advanceSentRef = useRef(false);

    const serverNow = () => Date.now() + clockOffsetRef.current;

    const clearTimers = () => {
        timersRef.current.forEach(clearInterval);
        timersRef.current = [];
    };

    // ── Round lifecycle helpers ──────────────────────────────────
    const fetchRound = useCallback(async () => {
        const data = await apiFetch<{
            round: RoundPayload | null;
            is_finished: boolean;
            scoreboard?: ScoreRow[];
        }>(`/battle/rooms/${room.code}/round`);

        if (data.is_finished || !data.round) {
            if (data.scoreboard) {
                setScoreboard(data.scoreboard);
            }

            setPhase('finished');

            return;
        }

        startRound(data.round);
    }, [room.code]);

    const startRound = useCallback(
        (payload: RoundPayload) => {
            clearTimers();
            clockOffsetRef.current =
                new Date(payload.server_now).getTime() - Date.now();
            advanceSentRef.current = false;

            setRound(payload);
            setSelectedId(null);
            setMyResult(null);
            setRoundEnd(null);
            setAnsweredCount(payload.answered_count);

            const startsAtMs = payload.starts_at
                ? new Date(payload.starts_at).getTime()
                : serverNow();
            const endsAtMs = payload.ends_at
                ? new Date(payload.ends_at).getTime()
                : startsAtMs + payload.question.time_limit_seconds * 1000;

            const tick = () => {
                const now = serverNow();

                if (now < startsAtMs) {
                    setPhase('countdown');
                    setCountdown(Math.ceil((startsAtMs - now) / 1000));

                    return;
                }

                setPhase('question');
                const left = Math.max(0, Math.ceil((endsAtMs - now) / 1000));
                setSecondsLeft(left);

                if (left > 0 && left <= 5) {
                    soundsRef.current.playTick();
                }

                if (left === 0 && !advanceSentRef.current) {
                    advanceSentRef.current = true;
                    apiFetch(`/battle/rooms/${room.code}/advance`, {
                        method: 'POST',
                        body: '{}',
                    }).catch(() => undefined);
                }
            };

            tick();
            timersRef.current.push(setInterval(tick, 250));
        },
        [room.code],
    );

    // ── Echo wiring ──────────────────────────────────────────────
    useEffect(() => {
        const channel = echo()
            .join(`battle.${room.code}`)
            .here((users: { id: number }[]) =>
                setOnlineIds(users.map((u) => u.id)),
            )
            .joining((user: { id: number }) =>
                setOnlineIds((prev) => [...new Set([...prev, user.id])]),
            )
            .leaving((user: { id: number }) =>
                setOnlineIds((prev) => prev.filter((id) => id !== user.id)),
            )
            .listen(
                '.room.updated',
                (e: { players: BattlePlayer[]; status: string }) => {
                    setPlayers(e.players);
                },
            )
            .listen('.battle.started', () => {
                soundsRef.current.playCorrect(0);
                void fetchRound();
            })
            .listen(
                '.battle.player-answered',
                (e: { answeredCount: number }) => {
                    setAnsweredCount(e.answeredCount);
                },
            )
            .listen('.battle.round-ended', (e: RoundEndedEvent) => {
                clearTimers();
                setRoundEnd(e);
                setScoreboard(e.scoreboard);
                setPhase('round_result');

                const mine = e.roundResults.find((r) => r.user_id === myId);

                if (mine?.is_correct) {
                    soundsRef.current.playCorrect(1);
                } else {
                    soundsRef.current.playWrong();
                }

                if (e.isFinal) {
                    setTimeout(() => {
                        setPhase('finished');
                        soundsRef.current.playTopicComplete();
                    }, 3500);
                } else if (e.nextRoundStartsAt) {
                    setTimeout(
                        () => void fetchRound(),
                        Math.max(
                            500,
                            new Date(e.nextRoundStartsAt).getTime() -
                                serverNow() -
                                1500,
                        ),
                    );
                }
            });

        void channel;

        return () => {
            echo().leave(`battle.${room.code}`);
            clearTimers();
        };
    }, [room.code, myId, fetchRound]);

    // Resume mid-battle on refresh
    useEffect(() => {
        if (room.status === 'in_progress') {
            if (current_round) {
                startRound(current_round);

                if (current_round.has_answered) {
                    setSelectedId(-1); // already locked in, id unknown — just disable
                }
            } else {
                void fetchRound();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Actions ──────────────────────────────────────────────────
    async function answer(choiceId: number | null, word?: string) {
        if (selectedId !== null || myResult || phase !== 'question') {
            return;
        }

        setSelectedId(choiceId ?? -1);

        try {
            const result = await apiFetch<{
                is_correct: boolean;
                points_earned: number;
                correct_word?: string | null;
            }>(`/battle/rooms/${room.code}/answers`, {
                method: 'POST',
                body: JSON.stringify({
                    choice_id: choiceId,
                    word: word ?? null,
                }),
            });
            setMyResult(result);
        } catch {
            setSelectedId(null);
        }
    }

    function copyCode() {
        navigator.clipboard.writeText(room.code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        });
    }

    const allOthersReady = players
        .filter((p) => !p.is_host)
        .every((p) => p.is_ready);
    const canStart = isHost && players.length >= 2 && allOthersReady;
    const me = players.find((p) => p.user_id === myId);
    const myTeam = me?.team ?? null;

    const redTotal = teamTotal(scoreboard, 'red');
    const blueTotal = teamTotal(scoreboard, 'blue');
    const winningTeam: Team | null =
        redTotal === blueTotal ? null : redTotal > blueTotal ? 'red' : 'blue';

    // ─────────────────────────────────────────────────────────────
    const roomColors = battleColor(room.color);
    const isTeamBattle = room.battle_type === 'team';

    return (
        <>
            <Head title={room.name ?? `Battle ${room.code}`} />

            <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-6">
                {/* Top bar */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-2.5 text-sm text-foreground/60">
                        <span
                            className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-game-navy',
                                roomColors.solid,
                            )}
                        >
                            {isTeamBattle ? (
                                <Shield size={15} />
                            ) : (
                                <Swords size={15} />
                            )}
                        </span>
                        <span className="min-w-0">
                            <span className="block truncate font-semibold text-foreground">
                                {room.name ?? `Battle ${room.code}`}
                            </span>
                            <span className="block truncate text-xs">
                                {isTeamBattle
                                    ? `Team Battle ${room.max_players / 2}v${room.max_players / 2}`
                                    : 'Single Battle'}{' '}
                                · {room.game_mode.title} · {room.topic.name}
                            </span>
                        </span>
                    </div>
                    {phase === 'waiting' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-foreground/50 hover:text-foreground"
                            onClick={() =>
                                router.post(`/battle/rooms/${room.code}/leave`)
                            }
                        >
                            <DoorOpen size={14} className="mr-1" />
                            Leave
                        </Button>
                    )}
                </div>

                {/* ═══ WAITING ROOM ═══ */}
                {phase === 'waiting' && (
                    <div className="flex flex-1 flex-col gap-6">
                        {/* Room code */}
                        <div className="rounded-3xl border border-foreground/10 bg-foreground/5 px-6 py-8 text-center">
                            <p className="mb-2 text-xs font-semibold tracking-widest text-foreground/40 uppercase">
                                Room Code
                            </p>
                            <button
                                onClick={copyCode}
                                className="group inline-flex items-center gap-3 font-mono text-5xl font-extrabold tracking-[0.25em] text-foreground transition hover:text-game-lime"
                            >
                                {room.code}
                                {copied ? (
                                    <Check
                                        size={22}
                                        className="text-game-correct"
                                    />
                                ) : (
                                    <Copy
                                        size={22}
                                        className="opacity-40 group-hover:opacity-100"
                                    />
                                )}
                            </button>
                            <p className="mt-3 text-xs text-foreground/40">
                                Share this code — friends can join from the
                                Battle Arena
                            </p>
                        </div>

                        {/* Players */}
                        <div>
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-foreground/40 uppercase">
                                    <Users size={13} />
                                    Players ({players.length}/{room.max_players}
                                    )
                                </h2>
                                <span className="text-xs text-foreground/30">
                                    min. 2 to start
                                </span>
                            </div>
                            {isTeamBattle ? (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {(['red', 'blue'] as const).map((team) => {
                                        const style = teamStyles[team];
                                        const teamPlayers = players.filter(
                                            (p) => p.team === team,
                                        );

                                        return (
                                            <div
                                                key={team}
                                                className={cn(
                                                    'rounded-2xl border-2 p-3',
                                                    style.panel,
                                                )}
                                            >
                                                <div className="mb-2 flex items-center justify-between px-1">
                                                    <p
                                                        className={cn(
                                                            'flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase',
                                                            style.text,
                                                        )}
                                                    >
                                                        <Shield size={13} />
                                                        {style.label}
                                                    </p>
                                                    <span className="text-xs text-foreground/40">
                                                        {teamPlayers.length}/
                                                        {room.max_players / 2}
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    <AnimatePresence>
                                                        {teamPlayers.map(
                                                            (p) => (
                                                                <WaitingPlayerCard
                                                                    key={
                                                                        p.user_id
                                                                    }
                                                                    player={p}
                                                                    online={onlineIds.includes(
                                                                        p.user_id,
                                                                    )}
                                                                />
                                                            ),
                                                        )}
                                                    </AnimatePresence>
                                                    {teamPlayers.length ===
                                                        0 && (
                                                        <p className="py-3 text-center text-xs text-foreground/40">
                                                            No players yet
                                                        </p>
                                                    )}
                                                </div>
                                                {me &&
                                                    me.team !== team &&
                                                    teamPlayers.length <
                                                        room.max_players /
                                                            2 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={cn(
                                                                'mt-2 w-full',
                                                                style.text,
                                                            )}
                                                            onClick={() =>
                                                                router.post(
                                                                    `/battle/rooms/${room.code}/team`,
                                                                    { team },
                                                                )
                                                            }
                                                        >
                                                            Switch to{' '}
                                                            {style.label}
                                                        </Button>
                                                    )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    <AnimatePresence>
                                        {players.map((p) => (
                                            <WaitingPlayerCard
                                                key={p.user_id}
                                                player={p}
                                                online={onlineIds.includes(
                                                    p.user_id,
                                                )}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="mt-auto space-y-2 pb-4">
                            {isHost ? (
                                <>
                                    <Button
                                        size="lg"
                                        disabled={!canStart}
                                        onClick={() =>
                                            router.post(
                                                `/battle/rooms/${room.code}/start`,
                                            )
                                        }
                                        className="w-full bg-game-coral font-bold text-game-navy hover:bg-game-coral/90 disabled:opacity-40"
                                    >
                                        <Play size={18} className="mr-1.5" />
                                        Start Battle
                                    </Button>
                                    {!canStart && (
                                        <p className="text-center text-xs text-foreground/40">
                                            {players.length < 2
                                                ? 'Waiting for at least one more player…'
                                                : 'Waiting for everyone to be ready…'}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <Button
                                    size="lg"
                                    onClick={() =>
                                        router.post(
                                            `/battle/rooms/${room.code}/ready`,
                                        )
                                    }
                                    className={cn(
                                        'w-full font-bold',
                                        me?.is_ready
                                            ? 'bg-foreground/10 text-foreground hover:bg-foreground/20'
                                            : 'bg-game-correct text-white hover:bg-game-correct/90',
                                    )}
                                >
                                    <Check size={18} className="mr-1.5" />
                                    {me?.is_ready
                                        ? "I'm not ready"
                                        : "I'm Ready!"}
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══ COUNTDOWN ═══ */}
                {phase === 'countdown' && (
                    <div className="flex flex-1 flex-col items-center justify-center gap-4">
                        <p className="text-sm font-semibold tracking-widest text-foreground/40 uppercase">
                            Round {round?.round_number ?? 1} of{' '}
                            {round?.total_rounds ?? room.total_rounds}
                        </p>
                        <motion.div
                            key={countdown}
                            initial={{ scale: 2.2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="font-display text-8xl font-extrabold text-game-lime"
                        >
                            {countdown > 0 ? countdown : 'GO!'}
                        </motion.div>
                    </div>
                )}

                {/* ═══ QUESTION ═══ */}
                {phase === 'question' && round && (
                    <div className="flex flex-1 flex-col gap-5">
                        {/* Battle HUD */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-foreground/60">
                                Round {round.round_number}/{round.total_rounds}
                            </span>
                            <span
                                className={cn(
                                    'font-display text-2xl font-extrabold tabular-nums',
                                    secondsLeft <= 5
                                        ? 'animate-pulse text-game-danger'
                                        : 'text-foreground',
                                )}
                            >
                                {secondsLeft}s
                            </span>
                            <span className="text-xs text-foreground/40">
                                {answeredCount}/{players.length} answered
                            </span>
                        </div>

                        {/* Question */}
                        <motion.div
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-3xl border border-foreground/10 bg-foreground/5 px-6 py-7 text-center"
                        >
                            {round.question.clue_image_urls?.length > 0 ? (
                                <div className="mb-3">
                                    <ClueImageGrid
                                        urls={round.question.clue_image_urls}
                                    />
                                </div>
                            ) : round.question.letters?.length &&
                              round.question.prompt_smiles ? (
                                <div className="mb-3">
                                    <ClueTileGrid
                                        smiles={round.question.prompt_smiles}
                                    />
                                </div>
                            ) : null}
                            {round.question.prompt_smiles &&
                                !round.question.letters?.length && (
                                    <MoleculeView
                                        smiles={round.question.prompt_smiles}
                                        className="mb-3"
                                    />
                                )}
                            {round.question.prompt_image_path && (
                                <img
                                    src={round.question.prompt_image_path}
                                    alt="Question"
                                    className="mx-auto mb-3 max-h-40 rounded-xl object-contain"
                                />
                            )}
                            {round.question.prompt_text && (
                                <p className="text-lg leading-snug font-semibold text-foreground">
                                    {round.question.prompt_text}
                                </p>
                            )}
                            <p className="mt-2 text-xs text-foreground/40">
                                {round.question.points} pts + speed bonus
                            </p>
                        </motion.div>

                        {/* Answer: letter tiles for 4-Pics-1-Word, choices otherwise */}
                        {round.question.letters?.length ? (
                            <WordBuilder
                                key={round.round_number}
                                letters={round.question.letters}
                                wordLength={round.question.word_length ?? 0}
                                disabled={!!myResult}
                                status={
                                    myResult
                                        ? myResult.is_correct
                                            ? 'correct'
                                            : 'wrong'
                                        : 'idle'
                                }
                                correctWord={myResult?.correct_word}
                                onSubmit={(word) => answer(null, word)}
                            />
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {round.choices.map((c, i) => (
                                    <motion.button
                                        key={c.id}
                                        initial={{ opacity: 0, y: 14 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        whileTap={
                                            selectedId === null
                                                ? { scale: 0.95 }
                                                : undefined
                                        }
                                        disabled={selectedId !== null}
                                        onClick={() => answer(c.id)}
                                        className={cn(
                                            'flex min-h-[76px] items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors',
                                            selectedId === c.id
                                                ? 'border-game-primary bg-game-primary/25 text-foreground'
                                                : selectedId !== null
                                                  ? 'border-foreground/10 bg-foreground/5 text-foreground/30'
                                                  : 'cursor-pointer border-foreground/20 bg-foreground/5 text-foreground hover:border-game-primary/60',
                                        )}
                                    >
                                        <span className="text-xs font-bold opacity-60">
                                            {String.fromCharCode(65 + i)}
                                        </span>
                                        {c.choice_smiles ? (
                                            <MoleculeView
                                                smiles={c.choice_smiles}
                                                width={200}
                                                height={110}
                                                className="pointer-events-none"
                                            />
                                        ) : c.choice_image_path ? (
                                            <img
                                                src={c.choice_image_path}
                                                alt=""
                                                className="h-10 object-contain"
                                            />
                                        ) : (
                                            <span className="text-sm font-medium">
                                                {c.choice_text}
                                            </span>
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        )}

                        {myResult && (
                            <motion.p
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center text-sm font-semibold text-foreground/60"
                            >
                                Answer locked in! Waiting for the others…
                            </motion.p>
                        )}
                    </div>
                )}

                {/* ═══ ROUND RESULT ═══ */}
                {phase === 'round_result' && roundEnd && (
                    <div className="relative flex flex-1 flex-col gap-5">
                        {roundEnd.roundResults.find((r) => r.user_id === myId)
                            ?.is_correct && <ConfettiBurst />}

                        <div className="text-center">
                            <h2 className="font-display text-3xl font-bold text-foreground">
                                Round {roundEnd.roundNumber} Results
                            </h2>
                            {roundEnd.explanation && (
                                <p className="mx-auto mt-2 max-w-md text-sm text-foreground/50">
                                    {roundEnd.explanation}
                                </p>
                            )}
                        </div>

                        {/* Feedback for the choice you picked */}
                        {selectedId !== null &&
                            roundEnd.choiceFeedback?.[selectedId] && (
                                <p
                                    className={
                                        selectedId === roundEnd.correctChoiceId
                                            ? 'rounded-xl border border-game-correct/40 bg-game-correct/10 px-4 py-2.5 text-sm text-game-correct italic'
                                            : 'rounded-xl border border-game-danger/40 bg-game-danger/10 px-4 py-2.5 text-sm text-game-danger italic'
                                    }
                                >
                                    {roundEnd.choiceFeedback[selectedId]}
                                </p>
                            )}

                        {/* Per-round results */}
                        <div className="space-y-2">
                            {roundEnd.roundResults
                                .slice()
                                .sort(
                                    (a, b) =>
                                        b.points_earned - a.points_earned ||
                                        a.time_taken_ms - b.time_taken_ms,
                                )
                                .map((r) => (
                                    <div
                                        key={r.user_id}
                                        className={cn(
                                            'flex items-center gap-3 rounded-2xl border px-4 py-3',
                                            r.is_correct
                                                ? 'border-game-correct/40 bg-game-correct/10'
                                                : 'border-game-danger/30 bg-game-danger/5',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'text-lg',
                                                r.is_correct
                                                    ? ''
                                                    : 'opacity-50',
                                            )}
                                        >
                                            {r.is_correct ? '✅' : '❌'}
                                        </span>
                                        <span
                                            className={cn(
                                                'flex-1 text-sm font-semibold',
                                                r.user_id === myId
                                                    ? 'text-game-lime'
                                                    : 'text-foreground',
                                            )}
                                        >
                                            {r.user_id === myId
                                                ? 'You'
                                                : r.name}
                                        </span>
                                        <span className="text-xs text-foreground/40">
                                            {(r.time_taken_ms / 1000).toFixed(
                                                1,
                                            )}
                                            s
                                        </span>
                                        <span
                                            className={cn(
                                                'font-display font-bold',
                                                r.is_correct
                                                    ? 'text-game-correct'
                                                    : 'text-foreground/30',
                                            )}
                                        >
                                            +{r.points_earned}
                                        </span>
                                    </div>
                                ))}
                        </div>

                        {/* Standings */}
                        {isTeamBattle && (
                            <TeamTotals
                                scoreboard={scoreboard}
                                myTeam={myTeam}
                            />
                        )}
                        <MiniScoreboard scoreboard={scoreboard} myId={myId} />

                        <p className="text-center text-xs text-foreground/40">
                            {roundEnd.isFinal
                                ? 'Final results coming up…'
                                : 'Next round starting…'}
                        </p>
                    </div>
                )}

                {/* ═══ FINISHED ═══ */}
                {phase === 'finished' && (
                    <div className="relative flex flex-1 flex-col items-center justify-center gap-8">
                        <ConfettiBurst mode="rain" count={60} />

                        <div className="text-center">
                            <p className="mb-1 text-sm font-semibold tracking-widest text-foreground/40 uppercase">
                                Battle Complete
                            </p>
                            <h1 className="font-display text-4xl font-extrabold text-foreground">
                                {isTeamBattle
                                    ? winningTeam === null
                                        ? "It's a tie!"
                                        : myTeam === winningTeam
                                          ? '🏆 Your team wins!'
                                          : `${teamStyles[winningTeam].emoji} ${teamStyles[winningTeam].label} wins!`
                                    : scoreboard[0]?.user_id === myId
                                      ? '🏆 Victory!'
                                      : `${scoreboard[0]?.name ?? '—'} wins!`}
                            </h1>
                        </div>

                        {isTeamBattle && (
                            <div className="w-full max-w-sm">
                                <TeamTotals
                                    scoreboard={scoreboard}
                                    myTeam={myTeam}
                                />
                            </div>
                        )}

                        {/* Podium */}
                        <div className="flex items-end gap-3">
                            {[1, 0, 2].map((rank) => {
                                const row = scoreboard[rank];

                                if (!row) {
                                    return <div key={rank} className="w-20" />;
                                }

                                const heights = ['h-24', 'h-32', 'h-16'];
                                const medals = ['🥈', '🥇', '🥉'];

                                return (
                                    <motion.div
                                        key={row.user_id}
                                        initial={{ y: 60, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{
                                            delay:
                                                rank === 0
                                                    ? 0.4
                                                    : rank === 1
                                                      ? 0.2
                                                      : 0.6,
                                            type: 'spring',
                                        }}
                                        className="flex w-24 flex-col items-center gap-2"
                                    >
                                        <span className="text-3xl">
                                            {medals[[1, 0, 2].indexOf(rank)]}
                                        </span>
                                        <p
                                            className={cn(
                                                'max-w-full truncate text-sm font-bold',
                                                row.user_id === myId
                                                    ? 'text-game-lime'
                                                    : 'text-foreground',
                                            )}
                                        >
                                            {row.user_id === myId
                                                ? 'You'
                                                : row.name}
                                        </p>
                                        <FinalScore value={row.score} />
                                        <div
                                            className={cn(
                                                'w-full rounded-t-xl bg-gradient-to-t',
                                                [1, 0, 2].indexOf(rank) === 1
                                                    ? 'from-game-primary/60 to-game-primary/20'
                                                    : 'from-foreground/15 to-foreground/5',
                                                heights[
                                                    [1, 0, 2].indexOf(rank)
                                                ],
                                            )}
                                        />
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Full standings */}
                        {scoreboard.length > 3 && (
                            <MiniScoreboard
                                scoreboard={scoreboard.slice(3)}
                                myId={myId}
                                startRank={4}
                            />
                        )}

                        <div className="flex gap-2">
                            <Button
                                asChild
                                size="lg"
                                className="bg-game-coral font-bold text-game-navy hover:bg-game-coral/90"
                            >
                                <Link href="/battle">
                                    <Swords size={16} className="mr-1.5" />
                                    Back to Arena
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="ghost"
                                size="lg"
                                className="text-foreground/60 hover:text-foreground"
                            >
                                <Link href="/dashboard">Home</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

// ─── Small components ────────────────────────────────────────────
function WaitingPlayerCard({
    player,
    online,
}: {
    player: BattlePlayer;
    online: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
                'flex items-center gap-2.5 rounded-2xl border px-3 py-3',
                player.is_ready || player.is_host
                    ? 'border-game-correct/40 bg-game-correct/10'
                    : 'border-foreground/10 bg-foreground/5',
            )}
        >
            <div className="relative">
                <PlayerAvatar
                    name={player.name}
                    avatarPath={player.avatar_path}
                />
                <span
                    className={cn(
                        'absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-background',
                        online ? 'bg-game-correct' : 'bg-foreground/20',
                    )}
                />
            </div>
            <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 truncate text-sm font-semibold text-foreground">
                    {player.name}
                    {player.is_host && (
                        <Crown
                            size={12}
                            className="shrink-0 fill-game-warning text-game-warning"
                        />
                    )}
                </p>
                <p className="text-[11px] text-foreground/40">
                    {player.is_host
                        ? 'Host'
                        : player.is_ready
                          ? 'Ready!'
                          : 'Not ready'}
                </p>
            </div>
            {(player.is_ready || player.is_host) && (
                <Check size={16} className="shrink-0 text-game-correct" />
            )}
        </motion.div>
    );
}

function TeamTotals({
    scoreboard,
    myTeam,
}: {
    scoreboard: ScoreRow[];
    myTeam: Team | null;
}) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {(['red', 'blue'] as const).map((team) => {
                const style = teamStyles[team];

                return (
                    <div
                        key={team}
                        className={cn(
                            'rounded-2xl border-2 px-4 py-3 text-center',
                            style.panel,
                            myTeam === team && 'ring-2 ring-foreground/20',
                        )}
                    >
                        <p
                            className={cn(
                                'text-[11px] font-bold tracking-widest uppercase',
                                style.text,
                            )}
                        >
                            {style.emoji} {style.label}
                            {myTeam === team && ' · You'}
                        </p>
                        <p className="font-display text-2xl font-extrabold text-foreground tabular-nums">
                            {teamTotal(scoreboard, team).toLocaleString()}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}

function PlayerAvatar({
    name,
    avatarPath,
}: {
    name: string;
    avatarPath: string | null;
}) {
    return avatarPath ? (
        <img
            src={avatarPath}
            alt={name}
            className="h-9 w-9 rounded-full object-cover"
        />
    ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-game-primary/25 text-sm font-bold text-foreground uppercase">
            {name.charAt(0)}
        </div>
    );
}

function MiniScoreboard({
    scoreboard,
    myId,
    startRank = 1,
}: {
    scoreboard: ScoreRow[];
    myId: number;
    startRank?: number;
}) {
    return (
        <div className="rounded-2xl border border-foreground/10 bg-foreground/5 p-3">
            <p className="mb-2 px-1 text-[11px] font-semibold tracking-widest text-foreground/40 uppercase">
                Standings
            </p>
            <div className="space-y-1">
                {scoreboard.map((row, i) => (
                    <div
                        key={row.user_id}
                        className={cn(
                            'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm',
                            row.user_id === myId ? 'bg-game-primary/15' : '',
                        )}
                    >
                        <span className="w-5 text-xs font-bold text-foreground/40">
                            #{startRank + i}
                        </span>
                        <span
                            className={cn(
                                'flex-1 truncate font-medium',
                                row.user_id === myId
                                    ? 'text-game-lime'
                                    : 'text-foreground',
                            )}
                        >
                            {row.user_id === myId ? 'You' : row.name}
                        </span>
                        <span className="font-display font-bold text-foreground tabular-nums">
                            {row.score.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FinalScore({ value }: { value: number }) {
    const display = useCountUp(value, 1000);

    return (
        <span className="font-display text-lg font-extrabold text-foreground tabular-nums">
            {display.toLocaleString()}
        </span>
    );
}
