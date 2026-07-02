import { Head, router, useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AdminGameMode } from '@/types/admin';

interface GameModesIndexProps {
    modes: AdminGameMode[];
}

export default function GameModesIndex({ modes }: GameModesIndexProps) {
    const [editingId, setEditingId] = useState<number | null>(null);

    const form = useForm({
        title: '',
        description: '',
        icon: '',
        is_active: true,
    });

    function startEdit(mode: AdminGameMode) {
        setEditingId(mode.id);
        form.setData({
            title: mode.title,
            description: mode.description ?? '',
            icon: mode.icon ?? '',
            is_active: mode.is_active,
        });
    }

    function save(mode: AdminGameMode) {
        form.put(`/admin/game-modes/${mode.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditingId(null),
        });
    }

    const modeLabel: Record<string, string> = {
        structure_to_name: 'Structure → Name',
        name_to_structure: 'Name → Structure',
        pattern_clue: 'Pattern Clue',
    };

    return (
        <>
            <Head title="Game Modes" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Game Modes</h1>
                    <p className="text-sm text-muted-foreground">Configure each game mode's title, icon, and availability</p>
                </div>

                <div className="space-y-3">
                    {modes.map((mode) => (
                        <div key={mode.id} className="rounded-xl border border-border bg-card p-5">
                            {editingId === mode.id ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Title</Label>
                                            <Input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Icon (emoji)</Label>
                                            <Input value={form.data.icon} onChange={(e) => form.setData('icon', e.target.value)} placeholder="🧪" />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Description</Label>
                                        <textarea
                                            value={form.data.description}
                                            onChange={(e) => form.setData('description', e.target.value)}
                                            rows={2}
                                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={form.data.is_active}
                                                onChange={(e) => form.setData('is_active', e.target.checked)}
                                                className="rounded"
                                            />
                                            <span className="text-sm text-foreground">Active (visible to players)</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                                            <Button size="sm" onClick={() => save(mode)} disabled={form.processing}>
                                                <Save size={14} className="mr-1" /> Save
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{mode.icon ?? '🎮'}</span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-foreground">{mode.title}</span>
                                                <Badge variant={mode.is_active ? 'default' : 'outline'} className="text-xs">
                                                    {mode.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">{mode.questions_count} questions</span>
                                            </div>
                                            <p className="mt-0.5 text-xs text-muted-foreground">{modeLabel[mode.code] ?? mode.code}</p>
                                            {mode.description && (
                                                <p className="mt-1 text-sm text-muted-foreground">{mode.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => startEdit(mode)}>Edit</Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

GameModesIndex.layout = {
    breadcrumbs: [{ title: 'Admin', href: '/admin' }, { title: 'Game Modes' }],
};
