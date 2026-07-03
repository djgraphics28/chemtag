import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AdminTopic } from '@/types/admin';

interface TopicsIndexProps {
    topics: AdminTopic[];
}

function blankTopic() {
    return { name: '', order: 1, questions_per_game: 10 };
}

export default function TopicsIndex({ topics }: TopicsIndexProps) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    const editForm = useForm(blankTopic());
    const createForm = useForm(blankTopic());

    function startEdit(topic: AdminTopic) {
        setEditingId(topic.id);
        editForm.setData({
            name: topic.name,
            order: topic.order,
            questions_per_game: topic.questions_per_game,
        });
    }

    function saveEdit(topic: AdminTopic) {
        editForm.put(`/admin/topics/${topic.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditingId(null),
        });
    }

    function handleDelete(topic: AdminTopic) {
        if (!confirm(`Delete topic "${topic.name}"?`)) return;
        router.delete(`/admin/topics/${topic.id}`, { preserveScroll: true });
    }

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/admin/topics', {
            preserveScroll: true,
            onSuccess: () => { setShowCreate(false); createForm.reset(); },
        });
    }

    return (
        <>
            <Head title="Topics" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Topics</h1>
                        <p className="text-sm text-muted-foreground">
                            {topics.length} topics · configure how many questions each game draws per topic
                        </p>
                    </div>
                    <Button onClick={() => setShowCreate(true)} disabled={showCreate}>
                        <Plus size={16} className="mr-1.5" /> Add Topic
                    </Button>
                </div>

                {showCreate && (
                    <form onSubmit={submitCreate} className="rounded-xl border-2 border-dashed border-border bg-card p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-foreground">New Topic</h2>
                        <TopicForm
                            data={createForm.data}
                            setData={createForm.setData}
                            errors={createForm.errors}
                            onSave={() => {}}
                            onCancel={() => setShowCreate(false)}
                            processing={createForm.processing}
                            isCreate
                        />
                    </form>
                )}

                <div className="space-y-2">
                    {topics.map((topic) => (
                        <div key={topic.id} className="rounded-xl border border-border bg-card p-4">
                            {editingId === topic.id ? (
                                <TopicForm
                                    data={editForm.data}
                                    setData={editForm.setData}
                                    errors={editForm.errors}
                                    onSave={() => saveEdit(topic)}
                                    onCancel={() => setEditingId(null)}
                                    processing={editForm.processing}
                                />
                            ) : (
                                <div className="flex items-center gap-4">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display font-bold text-primary">
                                        {topic.order}
                                    </div>
                                    <div className="flex-1">
                                        <span className="font-semibold text-foreground">{topic.name}</span>
                                        <p className="text-xs text-muted-foreground">
                                            {topic.questions_per_game} questions per game · {topic.questions_count} in the bank
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button size="sm" variant="outline" onClick={() => startEdit(topic)}>Edit</Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => handleDelete(topic)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {topics.length === 0 && (
                        <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
                            No topics yet — add your first topic to start building the question bank.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

TopicsIndex.layout = {
    breadcrumbs: [{ title: 'Admin', href: '/admin' }, { title: 'Topics' }],
};

function TopicForm({
    data, setData, errors, onSave, onCancel, processing, isCreate,
}: {
    data: { name: string; order: number; questions_per_game: number };
    setData: (field: string, value: string | number) => void;
    errors: Partial<Record<string, string>>;
    onSave: () => void;
    onCancel: () => void;
    processing: boolean;
    isCreate?: boolean;
}) {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="col-span-2 grid gap-1.5">
                    <Label className="text-xs">Name</Label>
                    <Input value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Alkanes Basics" />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
                <div className="grid gap-1.5">
                    <Label className="text-xs">Order</Label>
                    <Input type="number" min={1} value={data.order} onChange={(e) => setData('order', parseInt(e.target.value) || 1)} />
                </div>
                <div className="grid gap-1.5">
                    <Label className="text-xs">Questions / game</Label>
                    <Input
                        type="number"
                        min={2}
                        max={50}
                        value={data.questions_per_game}
                        onChange={(e) => setData('questions_per_game', parseInt(e.target.value) || 2)}
                    />
                    {errors.questions_per_game && <p className="text-xs text-destructive">{errors.questions_per_game}</p>}
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
                <Button type={isCreate ? 'submit' : 'button'} size="sm" onClick={isCreate ? undefined : onSave} disabled={processing}>
                    <Save size={14} className="mr-1" /> {isCreate ? 'Create' : 'Save'}
                </Button>
            </div>
        </div>
    );
}
