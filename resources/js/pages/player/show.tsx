import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, Clock, Star, Target, Trophy, Zap } from 'lucide-react';
import type { PlayerStats, RecentSession } from '@/types/game';

interface PlayerShowProps {
    player: {
        id: number;
        name: string;
        username: string;
        avatar_path: string | null;
        xp_total: number;
        joined_at: string;
    };
    stats: PlayerStats;
    recent_sessions: RecentSession[];
}

export default function PlayerShow({ player, stats, recent_sessions }: PlayerShowProps) {
    return (
        <>
            <Head title={`${player.name}'s Profile`} />

            <div className="mx-auto w-full max-w-xl space-y-8 px-4 py-8">
                {/* Profile header */}
                <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-2xl font-bold text-primary uppercase">
                        {player.avatar_path ? (
                            <img src={player.avatar_path} alt={player.name} className="h-16 w-16 rounded-full object-cover" />
                        ) : (
                            player.name.charAt(0)
                        )}
                    </div>
                    <div>
                        <h1 className="font-display text-2xl font-bold text-foreground">{player.name}</h1>
                        <p className="text-sm text-muted-foreground">@{player.username}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Joined {player.joined_at}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">
                        <Zap size={13} className="fill-primary" />
                        {player.xp_total.toLocaleString()} XP
                    </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                    <StatCard icon={<Trophy size={18} className="text-primary" />} label="Best Score" value={stats.best_score.toLocaleString()} />
                    <StatCard icon={<Target size={18} className="text-game-warning" />} label="Accuracy" value={`${stats.accuracy}%`} />
                    <StatCard icon={<CheckCircle2 size={18} className="text-game-correct" />} label="Games Won" value={stats.games_completed.toLocaleString()} />
                    <StatCard
                        icon={<Clock size={18} className="text-muted-foreground" />}
                        label="Fastest Answer"
                        value={stats.fastest_correct_seconds !== null ? `${stats.fastest_correct_seconds}s` : '—'}
                    />
                </div>

                {/* Recent sessions */}
                {recent_sessions.length > 0 && (
                    <section>
                        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent Games</h2>
                        <div className="space-y-2">
                            {recent_sessions.map((s) => (
                                <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                                    <Star
                                        size={16}
                                        className={s.status === 'completed' ? 'fill-primary text-primary' : 'text-muted'}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {s.game_mode?.title ?? '—'} · {s.level?.name ?? '—'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{s.ended_at}</p>
                                    </div>
                                    <span className="font-display font-bold text-primary">{s.score.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <div className="text-center">
                    <Link href="/game/leaderboard" className="text-sm text-primary hover:underline">
                        View Leaderboard →
                    </Link>
                </div>
            </div>
        </>
    );
}

PlayerShow.layout = {
    breadcrumbs: [{ title: 'Player Profile' }],
};

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4">
            <div className="shrink-0">{icon}</div>
            <div>
                <p className="font-display text-xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
            </div>
        </div>
    );
}
