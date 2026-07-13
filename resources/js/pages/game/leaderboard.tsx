import { Head, router } from '@inertiajs/react';
import { Crown, Trophy } from 'lucide-react';
import type { Topic } from '@/types/game';

interface LeaderboardPlayer {
    user: {
        id: number;
        name: string;
        username: string;
        avatar_path: string | null;
    } | null;
    best_score: number;
}

interface LeaderboardProps {
    topPlayers: LeaderboardPlayer[];
    userRank: number | null;
    topics: Pick<Topic, 'id' | 'name' | 'order'>[];
    selectedTopicId: number | null;
}

const podiumStyles = [
    {
        // 1st place — center, tallest
        order: 'order-2',
        height: 'h-28',
        bar: 'bg-gradient-to-t from-game-warning/80 to-game-warning',
        avatar: 'bg-game-warning text-game-navy ring-game-warning/40',
        medal: '🥇',
    },
    {
        // 2nd place — left
        order: 'order-1',
        height: 'h-20',
        bar: 'bg-gradient-to-t from-game-sky/70 to-game-sky',
        avatar: 'bg-game-sky text-game-navy ring-game-sky/40',
        medal: '🥈',
    },
    {
        // 3rd place — right
        order: 'order-3',
        height: 'h-16',
        bar: 'bg-gradient-to-t from-game-coral/70 to-game-coral',
        avatar: 'bg-game-coral text-game-navy ring-game-coral/40',
        medal: '🥉',
    },
];

export default function Leaderboard({
    topPlayers,
    userRank,
    topics,
    selectedTopicId,
}: LeaderboardProps) {
    function handleTopicChange(topicId: string) {
        router.get('/game/leaderboard', topicId ? { topic_id: topicId } : {}, {
            preserveScroll: true,
        });
    }

    const podium = topPlayers.slice(0, 3);
    const rest = topPlayers.slice(3);

    return (
        <>
            <Head title="Leaderboard" />

            <div className="mx-auto w-full max-w-xl space-y-6 px-4 py-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-foreground">
                            Hall of Fame 🏆
                        </h1>
                        {userRank && (
                            <p className="mt-1 text-sm text-muted-foreground">
                                Your rank:{' '}
                                <span className="rounded-full bg-game-purple/15 px-2 py-0.5 font-bold text-game-primary dark:text-primary">
                                    #{userRank}
                                </span>
                            </p>
                        )}
                    </div>
                    <span className="flex h-12 w-12 animate-wiggle items-center justify-center rounded-2xl bg-gradient-to-br from-game-warning/60 to-game-coral text-game-navy shadow-lg shadow-game-warning/30">
                        <Trophy size={24} />
                    </span>
                </div>

                {/* Topic filter */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    <button
                        onClick={() => handleTopicChange('')}
                        className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-all ${
                            !selectedTopicId
                                ? 'bg-gradient-to-r from-game-purple to-game-sky text-game-navy shadow-md shadow-game-purple/25'
                                : 'bg-muted text-muted-foreground hover:bg-game-purple/10 hover:text-foreground'
                        }`}
                    >
                        All Topics
                    </button>
                    {topics.map((topic) => (
                        <button
                            key={topic.id}
                            onClick={() => handleTopicChange(String(topic.id))}
                            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-all ${
                                selectedTopicId === topic.id
                                    ? 'bg-gradient-to-r from-game-purple to-game-sky text-game-navy shadow-md shadow-game-purple/25'
                                    : 'bg-muted text-muted-foreground hover:bg-game-purple/10 hover:text-foreground'
                            }`}
                        >
                            {topic.name}
                        </button>
                    ))}
                </div>

                {topPlayers.length === 0 && (
                    <div className="rounded-3xl border-2 border-dashed border-border py-12 text-center">
                        <p className="text-3xl">🔬</p>
                        <p className="mt-2 font-semibold text-foreground">
                            No scores yet
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Be the first on the podium!
                        </p>
                    </div>
                )}

                {/* Podium */}
                {podium.length > 0 && (
                    <div className="flex items-end justify-center gap-3 pt-6">
                        {podium.map((player, i) => {
                            const style = podiumStyles[i];

                            return (
                                <div
                                    key={player.user?.id ?? i}
                                    className={`flex w-24 flex-col items-center ${style.order}`}
                                >
                                    <span className="text-2xl">
                                        {style.medal}
                                    </span>
                                    <div
                                        className={`mt-1 flex h-12 w-12 items-center justify-center rounded-full font-display text-lg font-bold uppercase ring-4 ${style.avatar}`}
                                    >
                                        {i === 0 && (
                                            <Crown
                                                size={16}
                                                className="absolute -translate-y-8 fill-game-warning text-game-warning"
                                            />
                                        )}
                                        {player.user?.name.charAt(0) ?? '?'}
                                    </div>
                                    <p className="mt-1 w-full truncate text-center text-xs font-semibold text-foreground">
                                        {player.user?.name}
                                    </p>
                                    <p className="font-display text-sm font-bold text-game-primary dark:text-primary">
                                        {player.best_score.toLocaleString()}
                                    </p>
                                    <div
                                        className={`mt-2 w-full rounded-t-2xl ${style.height} ${style.bar}`}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Rankings below podium */}
                <div className="space-y-2">
                    {rest.map((player, i) => (
                        <div
                            key={player.user?.id ?? i}
                            className="flex items-center gap-4 rounded-2xl border-2 border-border bg-card px-4 py-3 transition-colors hover:border-game-purple/30"
                        >
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                                {i + 4}
                            </span>

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-game-purple/10 font-display text-sm font-bold text-game-primary uppercase dark:text-primary">
                                {player.user?.name.charAt(0) ?? '?'}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold text-foreground">
                                    {player.user?.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    @{player.user?.username}
                                </p>
                            </div>

                            <span className="font-display text-lg font-bold text-game-primary dark:text-primary">
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
