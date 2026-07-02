import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AdminLevel } from '@/types/admin';

interface LevelsIndexProps {
    levels: AdminLevel[];
}

const difficulties = ['easy', 'medium', 'hard', 'expert'] as const;

const diffColor: Record<string, string> = {
    easy: 'text-game-correct',
    medium: 'text-game-primary',
    hard: 'text-game-warning',
    expert: 'text-game-danger',
};

function blankLevel() {
    return { name: '', order: 1, difficulty: 'easy' as const, unlock_score_threshold: 0 };
}

export default function LevelsIndex({ levels }: LevelsIndexProps) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    const editForm = useForm({ name: '', order: 1, difficulty: 'easy' as string, unlock_score_threshold: 0 });
    const createForm = useForm(blankLevel());

    function startEdit(level: AdminLevel) {
        setEditingId(level.id);
        editForm.setData({
            name: level.name,
            order: level.order,
            difficulty: level.difficulty,
            unlock_score_threshold: level.unlock_score_threshold,
        });
    }

    function saveEdit(level: AdminLevel) {
        editForm.put(`/admin/levels/${level.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditingId(null),
        });
    }

    function handleDelete(level: AdminLevel) {
        if (!confirm(`Delete level "${level.name}"?`)) return;
        router.delete(`/admin/levels/${level.id}`, { preserveScroll: true });
    }

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/admin/levels', {
            preserveScroll: true,
            onSuccess: () => { setShowCreate(false); createForm.reset(); },
        });
    }

    return (
        <>
            <Head title="Levels" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Levels</h1>
                        <p className="text-sm text-muted-foreground">Manage difficulty tiers and XP unlock thresholds</p>
                    </div>
                    <Button onClick={() => setShowCreate(true)} disabled={showCreate}>
                        <Plus size={16} className="mr-1.5" /> Add Level
                    </Button>
                </div>

                <div className="space-y-2">
                    {levels.map((level) => (
                        <div key={level.id} className="rounded-xl border border-border bg-card p-4">
                            {editingId === level.id ? (
                                <LevelForm
                                    data={editForm.data}
                                    setData={editForm.setData}
                                    onSave={() => saveEdit(level)}
                                    onCancel={() => setEditingId(null)}
                                    processing={editForm.processing}
                                />
                            ) : (
                                <div className="flex items-center gap-4">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display font-bold text-primary">
                                        {level.order}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-foreground">{level.name}</span>
                                            <span className={`text-xs font-medium capitalize ${diffColor[level.difficulty]}`}>{level.difficulty}</span>
                                            <span className="text-xs text-muted-foreground">{level.questions_count} questions</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Unlock at {level.unlock_score_threshold} XP
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button size="sm" variant="outline" onClick={() => startEdit(level)}>Edit</Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => handleDelete(level)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {showCreate && (
                    <form onSubmit={submitCreate} className="rounded-xl border-2 border-dashed border-border bg-card p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-foreground">New Level</h2>
                        <LevelForm
                            data={createForm.data}
                            setData={createForm.setData}
                            onSave={() => {}}
                            onCancel={() => setShowCreate(false)}
                            processing={createForm.processing}
                            isCreate
                        />
                    </form>
                )}
            </div>
        </>
    );
}

LevelsIndex.layout = {
    breadcrumbs: [{ title: 'Admin', href: '/admin' }, { title: 'Levels' }],
};

function LevelForm({
    data, setData, onSave, onCancel, processing, isCreate,
}: {
    data: { name: string; order: number; difficulty: string; unlock_score_threshold: number };
    setData: (field: string, value: string | number) => void;
    onSave: () => void;
    onCancel: () => void;
    processing: boolean;
    isCreate?: boolean;
}) {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="grid gap-1.5">
                    <Label className="text-xs">Name</Label>
                    <Input value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Beginner" />
                </div>
                <div className="grid gap-1.5">
                    <Label className="text-xs">Order</Label>
                    <Input type="number" min={1} value={data.order} onChange={(e) => setData('order', parseInt(e.target.value))} />
                </div>
                <div className="grid gap-1.5">
                    <Label className="text-xs">Difficulty</Label>
                    <select
                        value={data.difficulty}
                        onChange={(e) => setData('difficulty', e.target.value)}
                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                    >
                        {difficulties.map((d) => <option key={d} value={d} className="capitalize">{d}</option>)}
                    </select>
                </div>
                <div className="grid gap-1.5">
                    <Label className="text-xs">Unlock XP</Label>
                    <Input type="number" min={0} value={data.unlock_score_threshold} onChange={(e) => setData('unlock_score_threshold', parseInt(e.target.value))} />
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button type={isCreate ? 'button' : 'button'} variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
                <Button type={isCreate ? 'submit' : 'button'} size="sm" onClick={isCreate ? undefined : onSave} disabled={processing}>
                    <Save size={14} className="mr-1" /> {isCreate ? 'Create' : 'Save'}
                </Button>
            </div>
        </div>
    );
}
