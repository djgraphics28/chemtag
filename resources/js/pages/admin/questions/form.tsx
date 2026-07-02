import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Choice {
    id?: number;
    choice_text: string;
    choice_image_path: string;
    is_correct: boolean;
    sort_order: number;
}

interface QuestionFormProps {
    question?: {
        id: number;
        game_mode_id: number;
        level_id: number;
        prompt_text: string | null;
        prompt_image_path: string | null;
        explanation: string | null;
        points: number;
        time_limit_seconds: number;
        is_active: boolean;
        choices: Choice[];
    };
    game_modes: { id: number; code: string; title: string }[];
    levels: { id: number; name: string; order: number; difficulty: string }[];
}

function emptyChoice(order: number): Choice {
    return { choice_text: '', choice_image_path: '', is_correct: false, sort_order: order };
}

export default function QuestionForm({ question, game_modes, levels }: QuestionFormProps) {
    const isEdit = !!question;

    const { data, setData, post, put, processing, errors } = useForm({
        game_mode_id: question?.game_mode_id ?? game_modes[0]?.id ?? 0,
        level_id: question?.level_id ?? levels[0]?.id ?? 0,
        prompt_text: question?.prompt_text ?? '',
        prompt_image_path: question?.prompt_image_path ?? '',
        explanation: question?.explanation ?? '',
        points: question?.points ?? 100,
        time_limit_seconds: question?.time_limit_seconds ?? 20,
        is_active: question?.is_active ?? true,
        choices: question?.choices ?? [emptyChoice(0), emptyChoice(1), emptyChoice(2), emptyChoice(3)],
    });

    function updateChoice(index: number, field: keyof Choice, value: string | boolean | number) {
        const updated = data.choices.map((c, i) => (i === index ? { ...c, [field]: value } : c));
        setData('choices', updated);
    }

    function addChoice() {
        setData('choices', [...data.choices, emptyChoice(data.choices.length)]);
    }

    function removeChoice(index: number) {
        setData('choices', data.choices.filter((_, i) => i !== index));
    }

    function setCorrect(index: number) {
        setData('choices', data.choices.map((c, i) => ({ ...c, is_correct: i === index })));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) {
            put(`/admin/questions/${question!.id}`);
        } else {
            post('/admin/questions');
        }
    }

    const correctCount = data.choices.filter((c) => c.is_correct).length;

    return (
        <>
            <Head title={isEdit ? 'Edit Question' : 'New Question'} />

            <div className="mx-auto max-w-2xl space-y-6">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/admin/questions"><ArrowLeft size={16} /></Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">{isEdit ? 'Edit Question' : 'New Question'}</h1>
                        <p className="text-sm text-muted-foreground">Fill in the prompt, choices, and metadata</p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    {/* Meta */}
                    <section className="rounded-xl border border-border bg-card p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-foreground">Classification</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Game Mode</Label>
                                <select
                                    value={data.game_mode_id}
                                    onChange={(e) => setData('game_mode_id', parseInt(e.target.value))}
                                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                >
                                    {game_modes.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                                </select>
                                <InputError message={errors.game_mode_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Level</Label>
                                <select
                                    value={data.level_id}
                                    onChange={(e) => setData('level_id', parseInt(e.target.value))}
                                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                >
                                    {levels.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.difficulty})</option>)}
                                </select>
                                <InputError message={errors.level_id} />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label>Points</Label>
                                <Input type="number" min={10} max={1000} value={data.points} onChange={(e) => setData('points', parseInt(e.target.value))} />
                                <InputError message={errors.points} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Time Limit (s)</Label>
                                <Input type="number" min={5} max={120} value={data.time_limit_seconds} onChange={(e) => setData('time_limit_seconds', parseInt(e.target.value))} />
                                <InputError message={errors.time_limit_seconds} />
                            </div>
                            <div className="flex items-end gap-2 pb-0.5">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-foreground">Active</span>
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Prompt */}
                    <section className="rounded-xl border border-border bg-card p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-foreground">Prompt</h2>
                        <div className="grid gap-2">
                            <Label>Prompt Text</Label>
                            <textarea
                                value={data.prompt_text}
                                onChange={(e) => setData('prompt_text', e.target.value)}
                                placeholder="e.g. What is the IUPAC name of this compound?"
                                rows={3}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <InputError message={errors.prompt_text} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Prompt Image URL (optional)</Label>
                            <Input value={data.prompt_image_path} onChange={(e) => setData('prompt_image_path', e.target.value)} placeholder="https://…" />
                            <InputError message={errors.prompt_image_path} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Explanation (shown after answer)</Label>
                            <textarea
                                value={data.explanation}
                                onChange={(e) => setData('explanation', e.target.value)}
                                placeholder="Explain the correct answer…"
                                rows={2}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <InputError message={errors.explanation} />
                        </div>
                    </section>

                    {/* Choices */}
                    <section className="rounded-xl border border-border bg-card p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-foreground">
                                Answer Choices
                                {correctCount !== 1 && (
                                    <span className="ml-2 text-xs font-normal text-destructive">
                                        (exactly 1 must be correct)
                                    </span>
                                )}
                            </h2>
                            {data.choices.length < 6 && (
                                <Button type="button" variant="outline" size="sm" onClick={addChoice}>
                                    <Plus size={14} className="mr-1" /> Add
                                </Button>
                            )}
                        </div>

                        {data.choices.map((choice, i) => (
                            <div
                                key={i}
                                className={`flex gap-3 rounded-xl border-2 p-3 transition-colors ${
                                    choice.is_correct ? 'border-game-correct bg-game-correct/5' : 'border-border'
                                }`}
                            >
                                <div className="flex items-start pt-1">
                                    <input
                                        type="radio"
                                        name="correct_choice"
                                        checked={choice.is_correct}
                                        onChange={() => setCorrect(i)}
                                        className="accent-green-500 cursor-pointer"
                                        title="Mark as correct"
                                    />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Input
                                        placeholder={`Choice ${String.fromCharCode(65 + i)} text`}
                                        value={choice.choice_text}
                                        onChange={(e) => updateChoice(i, 'choice_text', e.target.value)}
                                    />
                                    <Input
                                        placeholder="Image URL (optional)"
                                        value={choice.choice_image_path}
                                        onChange={(e) => updateChoice(i, 'choice_image_path', e.target.value)}
                                    />
                                </div>
                                {data.choices.length > 2 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive self-start mt-0.5"
                                        onClick={() => removeChoice(i)}
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                )}
                            </div>
                        ))}
                        <InputError message={errors.choices} />
                    </section>

                    <div className="flex justify-end gap-2">
                        <Button asChild variant="outline">
                            <Link href="/admin/questions">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing || correctCount !== 1}>
                            {processing ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Question'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

QuestionForm.layout = {
    breadcrumbs: [{ title: 'Admin', href: '/admin' }, { title: 'Questions', href: '/admin/questions' }, { title: 'Form' }],
};
