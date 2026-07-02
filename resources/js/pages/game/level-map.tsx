import { Head, router } from '@inertiajs/react';
import { Lock, Star, Trophy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { GameMode, Level } from '@/types/game';

interface LevelMapProps {
    modes: GameMode[];
    levels: (Level & { best_score: number; is_unlocked: boolean })[];
    user_xp: number;
}

const difficultyLabel: Record<string, string> = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    expert: 'Expert',
};

const difficultyColor: Record<string, string> = {
    easy: 'text-game-correct',
    medium: 'text-game-primary',
    hard: 'text-game-warning',
    expert: 'text-game-danger',
};

export default function LevelMap({ modes, levels, user_xp }: LevelMapProps) {
    const [selectedMode, setSelectedMode] = useState<number>(modes[0]?.id ?? 0);
    const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

    function handleStart() {
        if (!selectedLevel || !selectedMode) return;
        router.post('/game/sessions', { game_mode_id: selectedMode, level_id: selectedLevel });
    }

    return (
        <>
            <Head title="Level Map" />

            <div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-foreground">Level Map</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Select a mode and level to start playing</p>
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

                {/* Levels */}
                <section>
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Choose Level</h2>
                    <div className="space-y-2">
                        {levels.map((level) => {
                            const isSelected = selectedLevel === level.id;
                            const stars = level.best_score >= level.unlock_score_threshold * 1.5 ? 3
                                : level.best_score > 0 ? (level.best_score >= level.unlock_score_threshold ? 2 : 1) : 0;

                            return (
                                <button
                                    key={level.id}
                                    disabled={!level.is_unlocked}
                                    onClick={() => setSelectedLevel(level.id)}
                                    className={`flex w-full items-center gap-4 rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                                        !level.is_unlocked
                                            ? 'cursor-not-allowed border-border bg-muted/30 opacity-60'
                                            : isSelected
                                              ? 'border-primary bg-primary/10'
                                              : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5'
                                    }`}
                                >
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                            level.is_unlocked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {level.is_unlocked ? (
                                            <span className="font-display font-bold">{level.order}</span>
                                        ) : (
                                            <Lock size={16} />
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-foreground">{level.name}</span>
                                            <span className={`text-xs font-medium ${difficultyColor[level.difficulty]}`}>
                                                {difficultyLabel[level.difficulty]}
                                            </span>
                                        </div>
                                        {!level.is_unlocked && (
                                            <p className="text-xs text-muted-foreground">Requires {level.unlock_score_threshold} XP</p>
                                        )}
                                    </div>

                                    {level.is_unlocked && (
                                        <div className="flex items-center gap-0.5">
                                            {Array.from({ length: 3 }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={14}
                                                    className={i < stars ? 'fill-primary text-primary' : 'text-muted'}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </section>

                <Button
                    disabled={!selectedLevel || !selectedMode}
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

LevelMap.layout = {
    breadcrumbs: [{ title: 'Level Map', href: '/game/levels' }],
};
