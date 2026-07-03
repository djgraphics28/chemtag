import { Head, router } from '@inertiajs/react';
import { BookOpen, Star, Trophy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { GameMode, Topic } from '@/types/game';

interface TopicsProps {
    modes: GameMode[];
    topics: (Topic & { best_score: number })[];
    user_xp: number;
}

export default function Topics({ modes, topics, user_xp }: TopicsProps) {
    const [selectedMode, setSelectedMode] = useState<number>(modes[0]?.id ?? 0);
    const [selectedTopic, setSelectedTopic] = useState<number | null>(null);

    function handleStart() {
        if (!selectedTopic || !selectedMode) return;
        router.post('/game/sessions', { game_mode_id: selectedMode, topic_id: selectedTopic });
    }

    return (
        <>
            <Head title="Topics" />

            <div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-foreground">Topics</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Select a mode and topic to start playing</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">
                        <Trophy size={14} />
                        <span>{user_xp.toLocaleString()} XP</span>
                    </div>
                </div>

                {/* Game Mode Selector */}
                <section>
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Game Mode</h2>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {modes.map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => setSelectedMode(mode.id)}
                                className={`rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                                    selectedMode === mode.id
                                        ? 'border-primary bg-primary/10 text-foreground'
                                        : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary/5'
                                }`}
                            >
                                <div className="text-xl">{mode.icon ?? '🧪'}</div>
                                <div className="mt-1 text-sm font-semibold">{mode.title}</div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Topics */}
                <section>
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Choose Topic</h2>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {topics.map((topic) => {
                            const isSelected = selectedTopic === topic.id;

                            return (
                                <button
                                    key={topic.id}
                                    onClick={() => setSelectedTopic(topic.id)}
                                    className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                                        isSelected
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5'
                                    }`}
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <BookOpen size={16} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <span className="block truncate font-semibold text-foreground">{topic.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {topic.questions_per_game} questions per game
                                        </span>
                                    </div>

                                    {topic.best_score > 0 && (
                                        <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-primary">
                                            <Star size={12} className="fill-primary" />
                                            {topic.best_score.toLocaleString()}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </section>

                <Button
                    disabled={!selectedTopic || !selectedMode}
                    onClick={handleStart}
                    className="w-full bg-primary text-lg font-bold text-primary-foreground hover:bg-primary/90"
                    size="lg"
                >
                    Start Game
                </Button>
            </div>
        </>
    );
}

Topics.layout = {
    breadcrumbs: [{ title: 'Topics', href: '/game/topics' }],
};
