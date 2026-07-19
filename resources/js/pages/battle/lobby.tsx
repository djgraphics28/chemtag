import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Eye,
    Plus,
    Shield,
    Swords,
    User,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { battleColor, battleColors } from '@/lib/battle-colors';
import { cn } from '@/lib/utils';

interface LobbyProps {
    open_rooms: {
        code: string;
        name: string | null;
        color: string;
        battle_type: 'single' | 'team';
        host: { name: string; username: string };
        game_mode: { code: string; title: string };
        topic: { name: string };
        players_count: number;
        max_players: number;
    }[];
    my_room_code: string | null;
    game_modes: { id: number; code: string; title: string }[];
    topics: {
        id: number;
        name: string;
        order: number;
        questions_per_game: number;
    }[];
    player_limits: {
        min: number;
        max_single: number;
        team_sizes: number[];
    };
}

export default function BattleLobby({
    open_rooms,
    my_room_code,
    game_modes,
    topics,
    player_limits,
}: LobbyProps) {
    const { flash, auth } = usePage<{
        flash?: { success?: string; error?: string };
        auth: { user: { roles?: string[] } | null };
    }>().props;
    const isAdmin = auth?.user?.roles?.includes('admin') ?? false;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Live lobby: refresh the open-room list whenever any room changes
    useEffect(() => {
        echo()
            .channel('battle-lobby')
            .listen('.lobby.updated', () => {
                router.reload({ only: ['open_rooms'] });
            });

        return () => {
            echo().leaveChannel('battle-lobby');
        };
    }, []);

    const [showCreate, setShowCreate] = useState(false);

    const createForm = useForm({
        name: '',
        battle_type: 'single' as 'single' | 'team',
        color: 'purple',
        game_mode_id: game_modes[0]?.id ?? 0,
        topic_id: topics[0]?.id ?? 0,
        max_players: 10,
        team_size: 5,
    });

    const joinForm = useForm({ code: '' });

    /* Atari-style treatment applied only below the sm breakpoint. */
    const retroCard =
        'max-sm:rounded-xl max-sm:border-2 max-sm:border-game-navy max-sm:p-4 max-sm:shadow-[4px_4px_0_0_var(--color-game-navy)]';
    const retroButton =
        'max-sm:rounded-lg max-sm:border-2 max-sm:border-game-navy max-sm:font-display max-sm:tracking-widest max-sm:uppercase max-sm:shadow-[3px_3px_0_0_var(--color-game-navy)] max-sm:transition-all max-sm:active:translate-x-0.5 max-sm:active:translate-y-0.5 max-sm:active:shadow-none';
    const retroTile =
        'max-sm:rounded-lg max-sm:border-game-navy max-sm:shadow-[3px_3px_0_0_var(--color-game-navy)] max-sm:active:translate-x-0.5 max-sm:active:translate-y-0.5 max-sm:active:shadow-none';
    const retroTileSelected =
        'max-sm:rounded-lg max-sm:border-game-navy max-sm:translate-x-0.5 max-sm:translate-y-0.5 max-sm:shadow-none';

    function selectBattleType(type: 'single' | 'team') {
        createForm.setData('battle_type', type);
    }

    function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/battle/rooms');
    }

    function handleJoin(e: React.FormEvent) {
        e.preventDefault();
        joinForm.post('/battle/join');
    }

    return (
        <>
            <Head title="Battle Arena" />

            <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-game-coral/15 max-sm:rounded-lg max-sm:border-2 max-sm:border-game-navy max-sm:bg-game-coral max-sm:shadow-[3px_3px_0_0_var(--color-game-navy)]">
                        <Swords size={24} className="text-game-danger" />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl font-bold text-foreground">
                            Battle Arena
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Go solo or squad up — live quiz battles against your
                            classmates
                        </p>
                    </div>
                </div>

                {my_room_code && (
                    <div className="flex items-center justify-between rounded-2xl border border-primary/40 bg-primary/10 px-5 py-4 max-sm:rounded-xl max-sm:border-2 max-sm:border-game-navy max-sm:px-3 max-sm:py-3 max-sm:shadow-[4px_4px_0_0_var(--color-game-navy)]">
                        <p className="text-sm font-medium text-foreground">
                            You're already in room{' '}
                            <span className="font-mono font-bold">
                                {my_room_code}
                            </span>
                        </p>
                        <Button asChild size="sm" className={retroButton}>
                            <Link href={`/battle/rooms/${my_room_code}`}>
                                Rejoin <ArrowRight size={14} className="ml-1" />
                            </Link>
                        </Button>
                    </div>
                )}

                {/* Create + Join */}
                <div className="grid gap-4 sm:grid-cols-2">
                    {/* Create room */}
                    <div
                        className={cn(
                            'rounded-3xl border border-border bg-card p-6',
                            retroCard,
                        )}
                    >
                        <h2 className="mb-1 font-display text-lg font-bold text-foreground">
                            Create a Room
                        </h2>
                        <p className="mb-4 text-xs text-muted-foreground">
                            Name your battle, pick a color, then invite friends
                            with the room code
                        </p>

                        {showCreate ? (
                            <form onSubmit={handleCreate} className="space-y-3">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="battle-name">
                                        Battle name
                                    </Label>
                                    <Input
                                        id="battle-name"
                                        value={createForm.data.name}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'name',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Friday Chem Showdown"
                                        maxLength={40}
                                    />
                                    {createForm.errors.name && (
                                        <p className="text-xs text-destructive">
                                            {createForm.errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-1.5">
                                    <Label>Battle type</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                selectBattleType('single')
                                            }
                                            className={cn(
                                                'flex items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-all',
                                                createForm.data.battle_type ===
                                                    'single'
                                                    ? cn(
                                                          'border-game-purple bg-game-purple/15 text-foreground',
                                                          retroTileSelected,
                                                          'max-sm:bg-game-purple max-sm:text-game-navy',
                                                      )
                                                    : cn(
                                                          'border-border bg-background text-muted-foreground hover:border-game-purple/40',
                                                          retroTile,
                                                      ),
                                            )}
                                        >
                                            <User size={14} />
                                            Single
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                selectBattleType('team')
                                            }
                                            className={cn(
                                                'flex items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-all',
                                                createForm.data.battle_type ===
                                                    'team'
                                                    ? cn(
                                                          'border-game-purple bg-game-purple/15 text-foreground',
                                                          retroTileSelected,
                                                          'max-sm:bg-game-purple max-sm:text-game-navy',
                                                      )
                                                    : cn(
                                                          'border-border bg-background text-muted-foreground hover:border-game-purple/40',
                                                          retroTile,
                                                      ),
                                            )}
                                        >
                                            <Shield size={14} />
                                            Team
                                        </button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {createForm.data.battle_type === 'team'
                                            ? 'Red vs Blue — team scores are combined'
                                            : 'Everyone battles for themselves'}
                                    </p>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label>Battle color</Label>
                                    <div className="flex gap-2">
                                        {Object.entries(battleColors).map(
                                            ([key, c]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    aria-label={c.label}
                                                    title={c.label}
                                                    onClick={() =>
                                                        createForm.setData(
                                                            'color',
                                                            key,
                                                        )
                                                    }
                                                    className={cn(
                                                        'h-8 w-8 rounded-full transition-transform hover:scale-110',
                                                        c.solid,
                                                        createForm.data
                                                            .color === key &&
                                                            `scale-110 ring-4 ${c.ring}`,
                                                    )}
                                                />
                                            ),
                                        )}
                                    </div>
                                    {createForm.errors.color && (
                                        <p className="text-xs text-destructive">
                                            {createForm.errors.color}
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="battle-mode">
                                        Game mode
                                    </Label>
                                    <select
                                        id="battle-mode"
                                        value={createForm.data.game_mode_id}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'game_mode_id',
                                                Number(e.target.value),
                                            )
                                        }
                                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                    >
                                        {game_modes.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="battle-topic">Topic</Label>
                                    <select
                                        id="battle-topic"
                                        value={createForm.data.topic_id}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'topic_id',
                                                Number(e.target.value),
                                            )
                                        }
                                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                    >
                                        {topics.map((l) => (
                                            <option key={l.id} value={l.id}>
                                                {l.name} ·{' '}
                                                {l.questions_per_game} Qs
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {createForm.data.battle_type === 'team' ? (
                                    <div className="grid gap-1.5">
                                        <Label>Team format</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {player_limits.team_sizes.map(
                                                (size) => (
                                                    <button
                                                        key={size}
                                                        type="button"
                                                        onClick={() =>
                                                            createForm.setData(
                                                                'team_size',
                                                                size,
                                                            )
                                                        }
                                                        className={cn(
                                                            'rounded-xl border-2 px-3 py-1.5 font-display text-sm font-bold transition-all',
                                                            createForm.data
                                                                .team_size ===
                                                                size
                                                                ? cn(
                                                                      'border-game-purple bg-game-purple/15 text-foreground',
                                                                      retroTileSelected,
                                                                      'max-sm:bg-game-purple max-sm:text-game-navy',
                                                                  )
                                                                : cn(
                                                                      'border-border bg-background text-muted-foreground hover:border-game-purple/40',
                                                                      retroTile,
                                                                  ),
                                                        )}
                                                    >
                                                        {size}v{size}
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {createForm.data.team_size} players
                                            per team ·{' '}
                                            {createForm.data.team_size * 2}{' '}
                                            total
                                        </p>
                                        {createForm.errors.team_size && (
                                            <p className="text-xs text-destructive">
                                                {createForm.errors.team_size}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="battle-max-players">
                                            Max players
                                        </Label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                id="battle-max-players"
                                                type="range"
                                                min={player_limits.min}
                                                max={player_limits.max_single}
                                                value={
                                                    createForm.data.max_players
                                                }
                                                onChange={(e) =>
                                                    createForm.setData(
                                                        'max_players',
                                                        Number(e.target.value),
                                                    )
                                                }
                                                className="flex-1 accent-game-primary"
                                            />
                                            <span className="flex w-14 items-center justify-center gap-1 rounded-full bg-game-purple/15 py-1 text-sm font-bold text-game-primary">
                                                <Users size={12} />
                                                {createForm.data.max_players}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {player_limits.min}–
                                            {player_limits.max_single} players
                                            per battle
                                        </p>
                                        {createForm.errors.max_players && (
                                            <p className="text-xs text-destructive">
                                                {createForm.errors.max_players}
                                            </p>
                                        )}
                                    </div>
                                )}
                                <Button
                                    type="submit"
                                    className={cn('w-full', retroButton)}
                                    disabled={createForm.processing}
                                >
                                    <Plus size={15} className="mr-1" />
                                    Create Room
                                </Button>
                            </form>
                        ) : (
                            <Button
                                onClick={() => setShowCreate(true)}
                                className={cn('w-full', retroButton)}
                            >
                                <Plus size={15} className="mr-1" />
                                New Battle Room
                            </Button>
                        )}
                    </div>

                    {/* Join by code */}
                    <div
                        className={cn(
                            'rounded-3xl border border-border bg-card p-6',
                            retroCard,
                        )}
                    >
                        <h2 className="mb-1 font-display text-lg font-bold text-foreground">
                            Join with Code
                        </h2>
                        <p className="mb-4 text-xs text-muted-foreground">
                            Got a 6-character room code from a friend?
                        </p>
                        <form onSubmit={handleJoin} className="space-y-3">
                            <Input
                                value={joinForm.data.code}
                                onChange={(e) =>
                                    joinForm.setData(
                                        'code',
                                        e.target.value.toUpperCase(),
                                    )
                                }
                                placeholder="ABC123"
                                maxLength={6}
                                className="text-center font-mono text-lg font-bold tracking-[0.3em] uppercase"
                            />
                            {joinForm.errors.code && (
                                <p className="text-xs text-destructive">
                                    {joinForm.errors.code}
                                </p>
                            )}
                            <Button
                                type="submit"
                                variant="secondary"
                                className={cn('w-full', retroButton)}
                                disabled={
                                    joinForm.processing ||
                                    joinForm.data.code.length !== 6
                                }
                            >
                                Join Battle
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Open rooms */}
                <section>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                            Open Rooms
                        </h2>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-game-correct" />
                            Live
                        </span>
                    </div>

                    {open_rooms.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
                            No open rooms right now — create one and rally your
                            classmates!
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {open_rooms.map((room, i) => {
                                const colors = battleColor(room.color);

                                return (
                                    <motion.div
                                        key={room.code}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className={cn(
                                            'flex items-center gap-4 rounded-2xl border-2 bg-card px-5 py-4',
                                            colors.border,
                                            'max-sm:flex-wrap max-sm:gap-2 max-sm:rounded-xl max-sm:border-game-navy max-sm:px-3 max-sm:py-3 max-sm:shadow-[4px_4px_0_0_var(--color-game-navy)]',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-game-navy',
                                                colors.solid,
                                            )}
                                        >
                                            {room.battle_type === 'team' ? (
                                                <Shield size={18} />
                                            ) : (
                                                <Swords size={18} />
                                            )}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="flex items-center gap-2 truncate text-sm font-bold text-foreground">
                                                {room.name ??
                                                    `${room.host.name}'s Battle`}
                                                <span
                                                    className={cn(
                                                        'rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase',
                                                        colors.soft,
                                                    )}
                                                >
                                                    {room.battle_type === 'team'
                                                        ? `Team ${room.max_players / 2}v${room.max_players / 2}`
                                                        : 'Single'}
                                                </span>
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {room.game_mode.title} ·{' '}
                                                {room.topic.name} · Hosted by{' '}
                                                {room.host.name}
                                            </p>
                                        </div>
                                        <span className="rounded-lg bg-muted px-2 py-1 font-mono text-xs font-bold text-foreground">
                                            {room.code}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Users size={13} />
                                            {room.players_count}/
                                            {room.max_players}
                                        </span>
                                        {isAdmin ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                asChild
                                                className={retroButton}
                                            >
                                                <Link
                                                    href={`/battle/rooms/${room.code}`}
                                                >
                                                    <Eye
                                                        size={14}
                                                        className="mr-1"
                                                    />
                                                    Observe
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                className={retroButton}
                                                onClick={() =>
                                                    router.post(
                                                        '/battle/join',
                                                        {
                                                            code: room.code,
                                                        },
                                                    )
                                                }
                                            >
                                                Join
                                            </Button>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

BattleLobby.layout = {
    breadcrumbs: [{ title: 'Battle Arena' }],
};
