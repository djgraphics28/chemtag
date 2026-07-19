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
        tile: 'bg-game-purple text-game-navy',
        selected: 'border-game-purple bg-game-purple/10 ring-game-purple/30',
    },
    {
        tile: 'bg-game-coral text-game-navy',
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
            <Head title="Solo Quest" />

            <div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-8">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                            Pick your quest 🧭
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Select a mode and topic to start playing
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 rounded-lg border-2 border-game-navy bg-gradient-to-r from-game-purple to-game-sky px-3 py-1.5 text-sm font-bold text-game-navy shadow-[3px_3px_0_0_var(--color-game-navy)] sm:rounded-full sm:border-0 sm:px-4 sm:py-2 sm:shadow-md sm:shadow-game-purple/25">
                        <Trophy size={14} />
                        <span>{user_xp.toLocaleString()} XP</span>
                    </div>
                </div>

                {/* Game Mode Selector */}
                <section>
                    <h2 className="mb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                        Game Mode
                    </h2>
                    {/* Compact Atari-style tiles on mobile */}
                    <div className="grid grid-cols-3 gap-2 sm:hidden">
                        {modes.map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => setSelectedMode(mode.id)}
                                className={`flex flex-col items-center gap-1 rounded-lg border-2 border-game-navy px-2 py-2.5 text-game-navy transition-all ${
                                    selectedMode === mode.id
                                        ? 'translate-x-0.5 translate-y-0.5 bg-gradient-to-br from-game-purple to-game-sky shadow-none'
                                        : 'bg-card text-muted-foreground shadow-[3px_3px_0_0_var(--color-game-navy)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                                }`}
                            >
                                <span
                                    className={`text-xl ${selectedMode === mode.id ? 'animate-wiggle' : ''}`}
                                >
                                    {mode.icon ?? '🧪'}
                                </span>
                                <span className="font-display text-[10px] font-bold tracking-wider uppercase">
                                    {mode.title}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="hidden gap-2 sm:grid sm:grid-cols-3">
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
                    {/* Compact Atari-style tiles on mobile */}
                    <div className="grid grid-cols-2 gap-2 sm:hidden">
                        {topics.map((topic, index) => {
                            const isSelected = selectedTopic === topic.id;
                            const colors =
                                topicColorCycle[index % topicColorCycle.length];

                            return (
                                <button
                                    key={topic.id}
                                    onClick={() => setSelectedTopic(topic.id)}
                                    className={`flex flex-col items-center gap-1 rounded-lg border-2 border-game-navy px-2 py-2.5 transition-all ${
                                        isSelected
                                            ? `translate-x-0.5 translate-y-0.5 shadow-none ${colors.tile}`
                                            : 'bg-card text-foreground shadow-[3px_3px_0_0_var(--color-game-navy)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                                    }`}
                                >
                                    <span className="flex w-full items-center justify-center gap-1">
                                        <BookOpen
                                            size={12}
                                            className="shrink-0"
                                        />
                                        <span className="truncate font-display text-[10px] font-bold tracking-wider uppercase">
                                            {topic.name}
                                        </span>
                                    </span>
                                    <span
                                        className={`text-[9px] font-bold tracking-wider uppercase ${isSelected ? 'text-game-navy/70' : 'text-muted-foreground'}`}
                                    >
                                        {topic.best_score > 0 ? (
                                            <span className="flex items-center gap-0.5">
                                                <Star
                                                    size={9}
                                                    className="fill-current"
                                                />
                                                {topic.best_score.toLocaleString()}
                                            </span>
                                        ) : (
                                            `${topic.questions_per_game} Qs`
                                        )}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="hidden gap-2 sm:grid sm:grid-cols-2">
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
                    className="w-full rounded-lg border-2 border-game-navy bg-gradient-to-r from-game-purple to-game-sky font-display text-base font-bold tracking-widest text-game-navy uppercase shadow-[4px_4px_0_0_var(--color-game-navy)] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none disabled:shadow-none sm:rounded-md sm:border-0 sm:text-lg sm:tracking-normal sm:normal-case sm:shadow-lg sm:shadow-game-purple/30 sm:transition-transform sm:hover:scale-[1.02] sm:hover:from-game-purple/90 sm:hover:to-game-sky/90 sm:active:translate-x-0 sm:active:translate-y-0"
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
    breadcrumbs: [{ title: 'Solo Quest', href: '/game/topics' }],
};
