import { Head, Link, router, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, Plus, Swords, Users } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlashToast } from '@/hooks/use-flash-toast';

interface LobbyProps {
    open_rooms: {
        code: string;
        host: { name: string; username: string };
        game_mode: { code: string; title: string };
        level: { name: string };
        players_count: number;
        max_players: number;
    }[];
    my_room_code: string | null;
    game_modes: { id: number; code: string; title: string }[];
    levels: { id: number; name: string; order: number; difficulty: string }[];
}

export default function BattleLobby({ open_rooms, my_room_code, game_modes, levels }: LobbyProps) {
    useFlashToast();

    const [showCreate, setShowCreate] = useState(false);

    const createForm = useForm({
        game_mode_id: game_modes[0]?.id ?? 0,
        level_id: levels[0]?.id ?? 0,
    });

    const joinForm = useForm({ code: '' });

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
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-game-coral/15">
                        <Swords size={24} className="text-game-coral" />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl font-bold text-foreground">Battle Arena</h1>
                        <p className="text-sm text-muted-foreground">
                            Challenge other chemists to a live head-to-head quiz battle
                        </p>
                    </div>
                </div>

                {my_room_code && (
                    <div className="flex items-center justify-between rounded-2xl border border-primary/40 bg-primary/10 px-5 py-4">
                        <p className="text-sm font-medium text-foreground">
                            You're already in room <span className="font-mono font-bold">{my_room_code}</span>
                        </p>
                        <Button asChild size="sm">
                            <Link href={`/battle/rooms/${my_room_code}`}>
                                Rejoin <ArrowRight size={14} className="ml-1" />
                            </Link>
                        </Button>
                    </div>
                )}

                {/* Create + Join */}
                <div className="grid gap-4 sm:grid-cols-2">
                    {/* Create room */}
                    <div className="rounded-3xl border border-border bg-card p-6">
                        <h2 className="mb-1 font-display text-lg font-bold text-foreground">Create a Room</h2>
                        <p className="mb-4 text-xs text-muted-foreground">Pick a mode and level, then invite friends with the room code</p>

                        {showCreate ? (
                            <form onSubmit={handleCreate} className="space-y-3">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="battle-mode">Game mode</Label>
                                    <select
                                        id="battle-mode"
                                        value={createForm.data.game_mode_id}
                                        onChange={(e) => createForm.setData('game_mode_id', Number(e.target.value))}
                                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                    >
                                        {game_modes.map((m) => (
                                            <option key={m.id} value={m.id}>{m.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="battle-level">Level</Label>
                                    <select
                                        id="battle-level"
                                        value={createForm.data.level_id}
                                        onChange={(e) => createForm.setData('level_id', Number(e.target.value))}
                                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                    >
                                        {levels.map((l) => (
                                            <option key={l.id} value={l.id}>{l.name} · {l.difficulty}</option>
                                        ))}
                                    </select>
                                </div>
                                <Button type="submit" className="w-full" disabled={createForm.processing}>
                                    <Plus size={15} className="mr-1" />
                                    Create Room
                                </Button>
                            </form>
                        ) : (
                            <Button onClick={() => setShowCreate(true)} className="w-full">
                                <Plus size={15} className="mr-1" />
                                New Battle Room
                            </Button>
                        )}
                    </div>

                    {/* Join by code */}
                    <div className="rounded-3xl border border-border bg-card p-6">
                        <h2 className="mb-1 font-display text-lg font-bold text-foreground">Join with Code</h2>
                        <p className="mb-4 text-xs text-muted-foreground">Got a 6-character room code from a friend?</p>
                        <form onSubmit={handleJoin} className="space-y-3">
                            <Input
                                value={joinForm.data.code}
                                onChange={(e) => joinForm.setData('code', e.target.value.toUpperCase())}
                                placeholder="ABC123"
                                maxLength={6}
                                className="text-center font-mono text-lg font-bold tracking-[0.3em] uppercase"
                            />
                            {joinForm.errors.code && <p className="text-xs text-destructive">{joinForm.errors.code}</p>}
                            <Button
                                type="submit"
                                variant="secondary"
                                className="w-full"
                                disabled={joinForm.processing || joinForm.data.code.length !== 6}
                            >
                                Join Battle
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Open rooms */}
                <section>
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Open Rooms
                    </h2>

                    {open_rooms.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
                            No open rooms right now — create one and rally your classmates!
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {open_rooms.map((room, i) => (
                                <motion.div
                                    key={room.code}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4"
                                >
                                    <span className="rounded-lg bg-muted px-2.5 py-1 font-mono text-sm font-bold text-foreground">
                                        {room.code}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {room.game_mode.title} · {room.level.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Hosted by {room.host.name}</p>
                                    </div>
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Users size={13} />
                                        {room.players_count}/{room.max_players}
                                    </span>
                                    <Button
                                        size="sm"
                                        onClick={() => router.post('/battle/join', { code: room.code })}
                                    >
                                        Join
                                    </Button>
                                </motion.div>
                            ))}
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
