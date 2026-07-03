import { Head, router } from '@inertiajs/react';
import { Crown, Medal, Trophy } from 'lucide-react';
import type { Topic } from '@/types/game';

interface LeaderboardPlayer {
    user: { id: number; name: string; username: string; avatar_path: string | null } | null;
    best_score: number;
}

interface LeaderboardProps {
    topPlayers: LeaderboardPlayer[];
    userRank: number | null;
    topics: Pick<Topic, 'id' | 'name' | 'order'>[];
    selectedTopicId: number | null;
}

const rankIcon = [
    <Crown key={1} size={16} className="text-yellow-500" />,
    <Medal key={2} size={16} className="text-slate-400" />,
    <Medal key={3} size={16} className="text-amber-600" />,
];

export default function Leaderboard({ topPlayers, userRank, topics, selectedTopicId }: LeaderboardProps) {
    function handleTopicChange(topicId: string) {
        router.get('/game/leaderboard', topicId ? { topic_id: topicId } : {}, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Leaderboard" />

            <div className="mx-auto w-full max-w-xl px-4 py-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-foreground">Leaderboard</h1>
                        {userRank && (
                            <p className="mt-1 text-sm text-muted-foreground">
                                Your rank: <span className="font-bold text-primary">#{userRank}</span>
                            </p>
                        )}
                    </div>
                    <Trophy size={28} className="text-primary" />
                </div>

                {/* Topic filter */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    <button
                        onClick={() => handleTopicChange('')}
                        className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                            !selectedTopicId
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                    >
                        All Topics
                    </button>
                    {topics.map((topic) => (
                        <button
                            key={topic.id}
                            onClick={() => handleTopicChange(String(topic.id))}
                            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                                selectedTopicId === topic.id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                        >
                            {topic.name}
                        </button>
                    ))}
                </div>

                {/* Rankings */}
                <div className="space-y-2">
                    {topPlayers.length === 0 && (
                        <p className="py-12 text-center text-muted-foreground">No scores yet. Be the first!</p>
                    )}
                    {topPlayers.map((player, i) => (
                        <div
                            key={player.user?.id ?? i}
                            className={`flex items-center gap-4 rounded-2xl border px-4 py-3 ${
                                i === 0
                                    ? 'border-yellow-400/30 bg-yellow-400/5'
                                    : 'border-border bg-card'
                            }`}
                        >
                            <div className="flex w-7 items-center justify-center">
                                {i < 3 ? rankIcon[i] : <span className="text-sm font-bold text-muted-foreground">#{i + 1}</span>}
                            </div>

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary uppercase">
                                {player.user?.name.charAt(0) ?? '?'}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="truncate font-semibold text-foreground">{player.user?.name}</p>
                                <p className="text-xs text-muted-foreground">@{player.user?.username}</p>
                            </div>

                            <span className="font-display text-lg font-bold text-primary">
                                {player.best_score.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

Leaderboard.layout = {
    breadcrumbs: [{ title: 'Leaderboard', href: '/game/leaderboard' }],
};
