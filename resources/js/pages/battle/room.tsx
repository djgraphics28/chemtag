import { Head, Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { echo } from '@laravel/echo-react';
import { Check, Copy, Crown, DoorOpen, Play, Swords, Users } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ConfettiBurst } from '@/components/game/confetti-burst';
import { Button } from '@/components/ui/button';
import { useCountUp } from '@/hooks/use-count-up';
import { useGameSounds } from '@/hooks/use-game-sounds';
import { apiFetch } from '@/lib/api-fetch';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────
interface BattlePlayer {
    user_id: number;
    name: string;
    username: string;
    avatar_path: string | null;
    score: number;
    is_ready: boolean;
    is_host: boolean;
}

interface ScoreRow {
    user_id: number;
    name: string;
    username: string;
    avatar_path: string | null;
    score: number;
    is_host: boolean;
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
        points: number;
        time_limit_seconds: number;
    };
    choices: { id: number; choice_text: string | null; choice_image_path: string | null }[];
}

interface RoundEndedEvent {
    roundNumber: number;
    correctChoiceId: number;
    explanation: string | null;
    roundResults: { user_id: number; name: string; is_correct: boolean; points_earned: number; time_taken_ms: number }[];
    scoreboard: ScoreRow[];
    nextRoundNumber: number | null;
    nextRoundStartsAt: string | null;
    isFinal: boolean;
}

interface RoomProps {
    room: {
        code: string;
        status: 'waiting' | 'in_progress' | 'finished';
        host_id: number;
        max_players: number;
        game_mode: { code: string; title: string };
        level: { name: string };
        total_rounds: number;
    };
    players: BattlePlayer[];
    scoreboard: ScoreRow[] | null;
    current_round: RoundPayload | null;
}

type Phase = 'waiting' | 'countdown' | 'question' | 'round_result' | 'finished';

// ─── Page ────────────────────────────────────────────────────────
export default function BattleRoom({ room, players: initialPlayers, scoreboard: initialScoreboard, current_round }: RoomProps) {
    const { auth } = usePage<{ auth: { user: { id: number } } }>().props;
    const myId = auth.user.id;
    const isHost = room.host_id === myId;

    const [players, setPlayers] = useState<BattlePlayer[]>(initialPlayers);
    const [onlineIds, setOnlineIds] = useState<number[]>([]);
    const [phase, setPhase] = useState<Phase>(
        room.status === 'finished' ? 'finished' : room.status === 'in_progress' ? 'countdown' : 'waiting',
    );
    const [round, setRound] = useState<RoundPayload | null>(current_round);
    const [countdown, setCountdown] = useState(0);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [myResult, setMyResult] = useState<{ is_correct: boolean; points_earned: number } | null>(null);
    const [answeredCount, setAnsweredCount] = useState(current_round?.answered_count ?? 0);
    const [roundEnd, setRoundEnd] = useState<RoundEndedEvent | null>(null);
    const [scoreboard, setScoreboard] = useState<ScoreRow[]>(initialScoreboard ?? []);
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
        const data = await apiFetch<{ round: RoundPayload | null; is_finished: boolean; scoreboard?: ScoreRow[] }>(
            `/battle/rooms/${room.code}/round`,
        );

        if (data.is_finished || !data.round) {
            if (data.scoreboard) setScoreboard(data.scoreboard);
            setPhase('finished');
            return;
        }

        startRound(data.round);
    }, [room.code]);

    const startRound = useCallback((payload: RoundPayload) => {
        clearTimers();
        clockOffsetRef.current = new Date(payload.server_now).getTime() - Date.now();
        advanceSentRef.current = false;

        setRound(payload);
        setSelectedId(null);
        setMyResult(null);
        setRoundEnd(null);
        setAnsweredCount(payload.answered_count);

        const startsAtMs = payload.starts_at ? new Date(payload.starts_at).getTime() : serverNow();
        const endsAtMs = payload.ends_at ? new Date(payload.ends_at).getTime() : startsAtMs + payload.question.time_limit_seconds * 1000;

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

            if (left > 0 && left <= 5) soundsRef.current.playTick();

            if (left === 0 && !advanceSentRef.current) {
                advanceSentRef.current = true;
                apiFetch(`/battle/rooms/${room.code}/advance`, { method: 'POST', body: '{}' }).catch(() => undefined);
            }
        };

        tick();
        timersRef.current.push(setInterval(tick, 250));
    }, [room.code]);

    // ── Echo wiring ──────────────────────────────────────────────
    useEffect(() => {
        const channel = echo()
            .join(`battle.${room.code}`)
            .here((users: { id: number }[]) => setOnlineIds(users.map((u) => u.id)))
            .joining((user: { id: number }) => setOnlineIds((prev) => [...new Set([...prev, user.id])]))
            .leaving((user: { id: number }) => setOnlineIds((prev) => prev.filter((id) => id !== user.id)))
            .listen('.room.updated', (e: { players: BattlePlayer[]; status: string }) => {
                setPlayers(e.players);
            })
            .listen('.battle.started', () => {
                soundsRef.current.playCorrect(0);
                void fetchRound();
            })
            .listen('.battle.player-answered', (e: { answeredCount: number }) => {
                setAnsweredCount(e.answeredCount);
            })
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
                        soundsRef.current.playLevelComplete();
                    }, 3500);
                } else if (e.nextRoundStartsAt) {
                    setTimeout(() => void fetchRound(), Math.max(500, new Date(e.nextRoundStartsAt).getTime() - serverNow() - 1500));
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
    async function answer(choiceId: number) {
        if (selectedId !== null || myResult || phase !== 'question') return;
        setSelectedId(choiceId);

        try {
            const result = await apiFetch<{ is_correct: boolean; points_earned: number }>(
                `/battle/rooms/${room.code}/answers`,
                { method: 'POST', body: JSON.stringify({ choice_id: choiceId }) },
            );
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

    const allOthersReady = players.filter((p) => !p.is_host).every((p) => p.is_ready);
    const canStart = isHost && players.length >= 2 && allOthersReady;
    const me = players.find((p) => p.user_id === myId);

    // ─────────────────────────────────────────────────────────────
    return (
        <>
            <Head title={`Battle ${room.code}`} />

            <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-6">
                {/* Top bar */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                        <Swords size={16} className="text-game-coral" />
                        {room.game_mode.title} · {room.level.name}
                    </div>
                    {phase === 'waiting' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-white/50 hover:text-white"
                            onClick={() => router.post(`/battle/rooms/${room.code}/leave`)}
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
                        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-8 text-center">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/40">Room Code</p>
                            <button
                                onClick={copyCode}
                                className="group inline-flex items-center gap-3 font-mono text-5xl font-extrabold tracking-[0.25em] text-white transition hover:text-game-lime"
                            >
                                {room.code}
                                {copied ? <Check size={22} className="text-game-correct" /> : <Copy size={22} className="opacity-40 group-hover:opacity-100" />}
                            </button>
                            <p className="mt-3 text-xs text-white/40">Share this code — friends can join from the Battle Arena</p>
                        </div>

                        {/* Players */}
                        <div>
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-white/40">
                                    <Users size={13} />
                                    Players ({players.length}/{room.max_players})
                                </h2>
                                <span className="text-xs text-white/30">min. 2 to start</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                <AnimatePresence>
                                    {players.map((p) => (
                                        <motion.div
                                            key={p.user_id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className={cn(
                                                'flex items-center gap-2.5 rounded-2xl border px-3 py-3',
                                                p.is_ready || p.is_host
                                                    ? 'border-game-correct/40 bg-game-correct/10'
                                                    : 'border-white/10 bg-white/5',
                                            )}
                                        >
                                            <div className="relative">
                                                <PlayerAvatar name={p.name} avatarPath={p.avatar_path} />
                                                <span
                                                    className={cn(
                                                        'absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-game-navy',
                                                        onlineIds.includes(p.user_id) ? 'bg-game-correct' : 'bg-white/20',
                                                    )}
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="flex items-center gap-1 truncate text-sm font-semibold text-white">
                                                    {p.name}
                                                    {p.is_host && <Crown size={12} className="shrink-0 fill-game-warning text-game-warning" />}
                                                </p>
                                                <p className="text-[11px] text-white/40">
                                                    {p.is_host ? 'Host' : p.is_ready ? 'Ready!' : 'Not ready'}
                                                </p>
                                            </div>
                                            {(p.is_ready || p.is_host) && <Check size={16} className="shrink-0 text-game-correct" />}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-auto space-y-2 pb-4">
                            {isHost ? (
                                <>
                                    <Button
                                        size="lg"
                                        disabled={!canStart}
                                        onClick={() => router.post(`/battle/rooms/${room.code}/start`)}
                                        className="w-full bg-game-coral font-bold text-white hover:bg-game-coral/90 disabled:opacity-40"
                                    >
                                        <Play size={18} className="mr-1.5" />
                                        Start Battle
                                    </Button>
                                    {!canStart && (
                                        <p className="text-center text-xs text-white/40">
                                            {players.length < 2 ? 'Waiting for at least one more player…' : 'Waiting for everyone to be ready…'}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <Button
                                    size="lg"
                                    onClick={() => router.post(`/battle/rooms/${room.code}/ready`)}
                                    className={cn(
                                        'w-full font-bold',
                                        me?.is_ready
                                            ? 'bg-white/10 text-white hover:bg-white/20'
                                            : 'bg-game-correct text-game-navy hover:bg-game-correct/90',
                                    )}
                                >
                                    <Check size={18} className="mr-1.5" />
                                    {me?.is_ready ? "I'm not ready" : "I'm Ready!"}
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══ COUNTDOWN ═══ */}
                {phase === 'countdown' && (
                    <div className="flex flex-1 flex-col items-center justify-center gap-4">
                        <p className="text-sm font-semibold uppercase tracking-widest text-white/40">
                            Round {round?.round_number ?? 1} of {round?.total_rounds ?? room.total_rounds}
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
                            <span className="font-semibold text-white/60">
                                Round {round.round_number}/{round.total_rounds}
                            </span>
                            <span
                                className={cn(
                                    'font-display text-2xl font-extrabold tabular-nums',
                                    secondsLeft <= 5 ? 'animate-pulse text-game-danger' : 'text-white',
                                )}
                            >
                                {secondsLeft}s
                            </span>
                            <span className="text-xs text-white/40">
                                {answeredCount}/{players.length} answered
                            </span>
                        </div>

                        {/* Question */}
                        <motion.div
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-3xl border border-white/10 bg-white/5 px-6 py-7 text-center"
                        >
                            {round.question.prompt_image_path && (
                                <img
                                    src={round.question.prompt_image_path}
                                    alt="Question"
                                    className="mx-auto mb-3 max-h-40 rounded-xl object-contain"
                                />
                            )}
                            {round.question.prompt_text && (
                                <p className="text-lg font-semibold leading-snug text-white">{round.question.prompt_text}</p>
                            )}
                            <p className="mt-2 text-xs text-white/40">{round.question.points} pts + speed bonus</p>
                        </motion.div>

                        {/* Choices */}
                        <div className="grid grid-cols-2 gap-3">
                            {round.choices.map((c, i) => (
                                <motion.button
                                    key={c.id}
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                    whileTap={selectedId === null ? { scale: 0.95 } : undefined}
                                    disabled={selectedId !== null}
                                    onClick={() => answer(c.id)}
                                    className={cn(
                                        'flex min-h-[76px] items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors',
                                        selectedId === c.id
                                            ? 'border-game-primary bg-game-primary/25 text-white'
                                            : selectedId !== null
                                              ? 'border-white/10 bg-white/5 text-white/30'
                                              : 'cursor-pointer border-white/20 bg-white/5 text-white hover:border-game-primary/60',
                                    )}
                                >
                                    <span className="text-xs font-bold opacity-60">{String.fromCharCode(65 + i)}</span>
                                    {c.choice_image_path ? (
                                        <img src={c.choice_image_path} alt="" className="h-10 object-contain" />
                                    ) : (
                                        <span className="text-sm font-medium">{c.choice_text}</span>
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        {myResult && (
                            <motion.p
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center text-sm font-semibold text-white/60"
                            >
                                Answer locked in! Waiting for the others…
                            </motion.p>
                        )}
                    </div>
                )}

                {/* ═══ ROUND RESULT ═══ */}
                {phase === 'round_result' && roundEnd && (
                    <div className="relative flex flex-1 flex-col gap-5">
                        {roundEnd.roundResults.find((r) => r.user_id === myId)?.is_correct && <ConfettiBurst />}

                        <div className="text-center">
                            <h2 className="font-display text-3xl font-bold text-white">
                                Round {roundEnd.roundNumber} Results
                            </h2>
                            {roundEnd.explanation && (
                                <p className="mx-auto mt-2 max-w-md text-sm text-white/50">{roundEnd.explanation}</p>
                            )}
                        </div>

                        {/* Per-round results */}
                        <div className="space-y-2">
                            {roundEnd.roundResults
                                .slice()
                                .sort((a, b) => b.points_earned - a.points_earned || a.time_taken_ms - b.time_taken_ms)
                                .map((r) => (
                                    <div
                                        key={r.user_id}
                                        className={cn(
                                            'flex items-center gap-3 rounded-2xl border px-4 py-3',
                                            r.is_correct ? 'border-game-correct/40 bg-game-correct/10' : 'border-game-danger/30 bg-game-danger/5',
                                        )}
                                    >
                                        <span className={cn('text-lg', r.is_correct ? '' : 'opacity-50')}>
                                            {r.is_correct ? '✅' : '❌'}
                                        </span>
                                        <span className={cn('flex-1 text-sm font-semibold', r.user_id === myId ? 'text-game-lime' : 'text-white')}>
                                            {r.user_id === myId ? 'You' : r.name}
                                        </span>
                                        <span className="text-xs text-white/40">{(r.time_taken_ms / 1000).toFixed(1)}s</span>
                                        <span className={cn('font-display font-bold', r.is_correct ? 'text-game-correct' : 'text-white/30')}>
                                            +{r.points_earned}
                                        </span>
                                    </div>
                                ))}
                        </div>

                        {/* Standings */}
                        <MiniScoreboard scoreboard={scoreboard} myId={myId} />

                        <p className="text-center text-xs text-white/40">
                            {roundEnd.isFinal ? 'Final results coming up…' : 'Next round starting…'}
                        </p>
                    </div>
                )}

                {/* ═══ FINISHED ═══ */}
                {phase === 'finished' && (
                    <div className="relative flex flex-1 flex-col items-center justify-center gap-8">
                        <ConfettiBurst mode="rain" count={60} />

                        <div className="text-center">
                            <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-white/40">Battle Complete</p>
                            <h1 className="font-display text-4xl font-extrabold text-white">
                                {scoreboard[0]?.user_id === myId ? '🏆 Victory!' : `${scoreboard[0]?.name ?? '—'} wins!`}
                            </h1>
                        </div>

                        {/* Podium */}
                        <div className="flex items-end gap-3">
                            {[1, 0, 2].map((rank) => {
                                const row = scoreboard[rank];
                                if (!row) return <div key={rank} className="w-20" />;
                                const heights = ['h-24', 'h-32', 'h-16'];
                                const medals = ['🥈', '🥇', '🥉'];

                                return (
                                    <motion.div
                                        key={row.user_id}
                                        initial={{ y: 60, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: rank === 0 ? 0.4 : rank === 1 ? 0.2 : 0.6, type: 'spring' }}
                                        className="flex w-24 flex-col items-center gap-2"
                                    >
                                        <span className="text-3xl">{medals[[1, 0, 2].indexOf(rank)]}</span>
                                        <p className={cn('max-w-full truncate text-sm font-bold', row.user_id === myId ? 'text-game-lime' : 'text-white')}>
                                            {row.user_id === myId ? 'You' : row.name}
                                        </p>
                                        <FinalScore value={row.score} />
                                        <div
                                            className={cn(
                                                'w-full rounded-t-xl bg-gradient-to-t',
                                                [1, 0, 2].indexOf(rank) === 1
                                                    ? 'from-game-primary/60 to-game-primary/20'
                                                    : 'from-white/15 to-white/5',
                                                heights[[1, 0, 2].indexOf(rank)],
                                            )}
                                        />
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Full standings */}
                        {scoreboard.length > 3 && <MiniScoreboard scoreboard={scoreboard.slice(3)} myId={myId} startRank={4} />}

                        <div className="flex gap-2">
                            <Button asChild size="lg" className="bg-game-coral font-bold text-white hover:bg-game-coral/90">
                                <Link href="/battle">
                                    <Swords size={16} className="mr-1.5" />
                                    Back to Arena
                                </Link>
                            </Button>
                            <Button asChild variant="ghost" size="lg" className="text-white/60 hover:text-white">
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
function PlayerAvatar({ name, avatarPath }: { name: string; avatarPath: string | null }) {
    return avatarPath ? (
        <img src={avatarPath} alt={name} className="h-9 w-9 rounded-full object-cover" />
    ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-game-primary/25 text-sm font-bold text-white uppercase">
            {name.charAt(0)}
        </div>
    );
}

function MiniScoreboard({ scoreboard, myId, startRank = 1 }: { scoreboard: ScoreRow[]; myId: number; startRank?: number }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-widest text-white/40">Standings</p>
            <div className="space-y-1">
                {scoreboard.map((row, i) => (
                    <div
                        key={row.user_id}
                        className={cn(
                            'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm',
                            row.user_id === myId ? 'bg-game-primary/15' : '',
                        )}
                    >
                        <span className="w-5 text-xs font-bold text-white/40">#{startRank + i}</span>
                        <span className={cn('flex-1 truncate font-medium', row.user_id === myId ? 'text-game-lime' : 'text-white')}>
                            {row.user_id === myId ? 'You' : row.name}
                        </span>
                        <span className="font-display font-bold tabular-nums text-white">{row.score.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FinalScore({ value }: { value: number }) {
    const display = useCountUp(value, 1000);

    return <span className="font-display text-lg font-extrabold tabular-nums text-white">{display.toLocaleString()}</span>;
}
