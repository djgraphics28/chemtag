import { Head, router } from '@inertiajs/react';
import { BookOpen, Rocket, Star, Trophy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { GameMode, Topic } from '@/types/game';

interface TopicsProps {
    modes: GameMode[];
    topics: (Topic & { best_score: number })[];
    user_xp: number;
}

const topicColorCycle = [
    {
        tile: 'bg-game-purple text-white',
        selected: 'border-game-purple bg-game-purple/10 ring-game-purple/30',
    },
    {
        tile: 'bg-game-coral text-white',
        selected: 'border-game-coral bg-game-coral/10 ring-game-coral/30',
    },
    {
        tile: 'bg-game-sky text-game-navy',
        selected: 'border-game-sky bg-game-sky/15 ring-game-sky/40',
    },
    {
        tile: 'bg-game-lime text-game-navy',
        selected: 'border-game-lime bg-game-lime/10 ring-game-lime/30',
    },
];

export default function Topics({ modes, topics, user_xp }: TopicsProps) {
    const [selectedMode, setSelectedMode] = useState<number>(modes[0]?.id ?? 0);
    const [selectedTopic, setSelectedTopic] = useState<number | null>(null);

    function handleStart() {
        if (!selectedTopic || !selectedMode) {
return;
}

        router.post('/game/sessions', {
            game_mode_id: selectedMode,
            topic_id: selectedTopic,
        });
    }

    return (
        <>
            <Head title="Topics" />

            <div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-foreground">
                            Pick your quest 🧭
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Select a mode and topic to start playing
                        </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-game-purple to-game-primary px-4 py-2 text-sm font-bold text-white shadow-md shadow-game-purple/25">
                        <Trophy size={14} />
                        <span>{user_xp.toLocaleString()} XP</span>
                    </div>
                </div>

                {/* Game Mode Selector */}
                <section>
                    <h2 className="mb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                        Game Mode
                    </h2>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {modes.map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => setSelectedMode(mode.id)}
                                className={`rounded-2xl border-2 px-4 py-3 text-left transition-all hover:-translate-y-0.5 ${
                                    selectedMode === mode.id
                                        ? 'border-game-purple bg-gradient-to-br from-game-purple/15 to-game-sky/15 text-foreground shadow-md ring-2 shadow-game-purple/15 ring-game-purple/25'
                                        : 'border-border bg-card text-muted-foreground hover:border-game-purple/40 hover:bg-game-purple/5'
                                }`}
                            >
                                <div
                                    className={`text-2xl transition-transform ${selectedMode === mode.id ? 'animate-wiggle' : ''}`}
                                >
                                    {mode.icon ?? '🧪'}
                                </div>
                                <div className="mt-1 text-sm font-semibold">
                                    {mode.title}
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Topics */}
                <section>
                    <h2 className="mb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                        Choose Topic
                    </h2>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {topics.map((topic, index) => {
                            const isSelected = selectedTopic === topic.id;
                            const colors =
                                topicColorCycle[index % topicColorCycle.length];

                            return (
                                <button
                                    key={topic.id}
                                    onClick={() => setSelectedTopic(topic.id)}
                                    className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all hover:-translate-y-0.5 ${
                                        isSelected
                                            ? `${colors.selected} shadow-md ring-2`
                                            : 'border-border bg-card hover:border-game-purple/40 hover:bg-game-purple/5'
                                    }`}
                                >
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ${colors.tile}`}
                                    >
                                        <BookOpen size={16} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <span className="block truncate font-semibold text-foreground">
                                            {topic.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {topic.questions_per_game} questions
                                            per game
                                        </span>
                                    </div>

                                    {topic.best_score > 0 && (
                                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-game-warning/15 px-2 py-1 text-xs font-bold text-game-warning">
                                            <Star
                                                size={12}
                                                className="fill-game-warning"
                                            />
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
                    className="w-full bg-gradient-to-r from-game-purple to-game-primary font-display text-lg font-bold text-white shadow-lg shadow-game-purple/30 transition-transform hover:scale-[1.02] hover:from-game-purple/90 hover:to-game-primary/90 disabled:shadow-none"
                    size="lg"
                >
                    <Rocket size={18} className="mr-2" />
                    Start Game
                </Button>
            </div>
        </>
    );
}

Topics.layout = {
    breadcrumbs: [{ title: 'Topics', href: '/game/topics' }],
};
