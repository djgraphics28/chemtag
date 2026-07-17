import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    FlaskConical,
    ImageIcon,
    Plus,
    Trash2,
    Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { MoleculeEditor } from '@/components/chem/molecule-editor';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Choice {
    id?: number;
    choice_text: string;
    feedback_text?: string | null;
    choice_image: File | null;
    choice_image_url?: string | null;
    choice_smiles?: string | null;
    is_correct: boolean;
    sort_order: number;
}

interface QuestionFormProps {
    question?: {
        id: number;
        game_mode_id: number;
        topic_id: number;
        prompt_text: string | null;
        prompt_image_url: string | null;
        clue_image_urls: string[];
        prompt_smiles: string | null;
        explanation: string | null;
        points: number;
        time_limit_seconds: number;
        is_active: boolean;
        choices: Choice[];
    };
    game_modes: { id: number; code: string; title: string }[];
    topics: { id: number; name: string; order: number }[];
    filters?: Record<string, string>;
}

function emptyChoice(order: number): Choice {
    return {
        choice_text: '',
        choice_image: null,
        choice_smiles: '',
        is_correct: false,
        feedback_text: '',
        sort_order: order,
    };
}

export default function QuestionForm({
    question,
    game_modes,
    topics,
    filters,
}: QuestionFormProps) {
    const isEdit = !!question;

    // Return to the same filtered/paginated index view after save or cancel
    const indexParams = new URLSearchParams(filters ?? {});
    const indexUrl = `/admin/questions${indexParams.size > 0 ? `?${indexParams.toString()}` : ''}`;

    const { data, setData, post, processing, errors, transform } = useForm({
        _method: question ? 'put' : 'post',
        filters: filters ?? {},
        game_mode_id: question?.game_mode_id ?? game_modes[0]?.id ?? 0,
        topic_id: question?.topic_id ?? topics[0]?.id ?? 0,
        prompt_text: question?.prompt_text ?? '',
        prompt_image: null as File | null,
        answer_word: question?.choices?.[0]?.choice_text ?? '',
        clue_images: [null, null, null, null] as (File | null)[],
        prompt_smiles: question?.prompt_smiles ?? '',
        explanation: question?.explanation ?? '',
        points: question?.points ?? 100,
        time_limit_seconds: question?.time_limit_seconds ?? 20,
        is_active: question?.is_active ?? true,
        choices: question?.choices.map((c) => ({
            ...c,
            choice_image: null,
        })) ?? [emptyChoice(0), emptyChoice(1), emptyChoice(2), emptyChoice(3)],
    });

    function updateChoice(
        index: number,
        field: keyof Choice,
        value: string | boolean | number | File | null,
    ) {
        const updated = data.choices.map((c, i) =>
            i === index ? { ...c, [field]: value } : c,
        );
        setData('choices', updated);
    }

    function addChoice() {
        setData('choices', [...data.choices, emptyChoice(data.choices.length)]);
    }

    function removeChoice(index: number) {
        setData(
            'choices',
            data.choices.filter((_, i) => i !== index),
        );
    }

    function setCorrect(index: number) {
        setData(
            'choices',
            data.choices.map((c, i) => ({ ...c, is_correct: i === index })),
        );
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        // Always POST (with _method spoofing on edit): file uploads
        // require multipart form data, which PUT cannot carry.
        post(isEdit ? `/admin/questions/${question!.id}` : '/admin/questions', {
            forceFormData: true,
        });
    }

    const correctCount = data.choices.filter((c) => c.is_correct).length;
    const selectedMode = game_modes.find((m) => m.id === data.game_mode_id);
    const isStructureMode = selectedMode?.code === 'structure_to_name';
    const showSketcher = isStructureMode;
    const showChoiceSketchers = selectedMode?.code === 'name_to_structure';
    const isCluePuzzle = selectedMode?.code === 'pattern_clue';

    // 4 Pics 1 Word stores the answer as the single correct choice
    transform((formData) =>
        isCluePuzzle
            ? {
                  ...formData,
                  choices: [
                      {
                          id: question?.choices?.[0]?.id,
                          choice_text: formData.answer_word,
                          choice_image: null,
                          choice_smiles: '',
                          feedback_text: '',
                          is_correct: true,
                          sort_order: 0,
                      },
                  ],
              }
            : formData,
    );

    const canSubmit = isCluePuzzle
        ? data.answer_word.trim().length > 0
        : correctCount === 1;

    return (
        <>
            <Head title={isEdit ? 'Edit Question' : 'New Question'} />

            <div className="w-full space-y-6">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="sm">
                        <Link href={indexUrl}>
                            <ArrowLeft size={16} />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">
                            {isEdit ? 'Edit Question' : 'New Question'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Fill in the prompt, choices, and metadata
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    {/* Meta */}
                    <section className="space-y-4 rounded-xl border border-border bg-card p-5">
                        <h2 className="text-sm font-semibold text-foreground">
                            Classification
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Game Mode</Label>
                                <select
                                    value={data.game_mode_id}
                                    onChange={(e) =>
                                        setData(
                                            'game_mode_id',
                                            parseInt(e.target.value),
                                        )
                                    }
                                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                >
                                    {game_modes.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.title}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.game_mode_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Topic</Label>
                                <select
                                    value={data.topic_id}
                                    onChange={(e) =>
                                        setData(
                                            'topic_id',
                                            parseInt(e.target.value),
                                        )
                                    }
                                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                                >
                                    {topics.map((l) => (
                                        <option key={l.id} value={l.id}>
                                            {l.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.topic_id} />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label>Points</Label>
                                <Input
                                    type="number"
                                    min={10}
                                    max={1000}
                                    value={data.points}
                                    onChange={(e) =>
                                        setData(
                                            'points',
                                            parseInt(e.target.value),
                                        )
                                    }
                                />
                                <InputError message={errors.points} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Time Limit (s)</Label>
                                <Input
                                    type="number"
                                    min={5}
                                    max={120}
                                    value={data.time_limit_seconds}
                                    onChange={(e) =>
                                        setData(
                                            'time_limit_seconds',
                                            parseInt(e.target.value),
                                        )
                                    }
                                />
                                <InputError
                                    message={errors.time_limit_seconds}
                                />
                            </div>
                            <div className="flex items-end gap-2 pb-0.5">
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) =>
                                            setData(
                                                'is_active',
                                                e.target.checked,
                                            )
                                        }
                                        className="rounded"
                                    />
                                    <span className="text-sm text-foreground">
                                        Active
                                    </span>
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Prompt */}
                    <section className="space-y-4 rounded-xl border border-border bg-card p-5">
                        <h2 className="text-sm font-semibold text-foreground">
                            Prompt
                        </h2>
                        <div className="grid gap-2">
                            <Label>Prompt Text</Label>
                            <textarea
                                value={data.prompt_text}
                                onChange={(e) =>
                                    setData('prompt_text', e.target.value)
                                }
                                placeholder="e.g. What is the IUPAC name of this compound?"
                                rows={3}
                                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                            />
                            <InputError message={errors.prompt_text} />
                        </div>
                        {showSketcher && (
                            <div className="grid gap-2">
                                <Label className="flex items-center gap-1.5">
                                    <FlaskConical
                                        size={14}
                                        className="text-game-primary"
                                    />
                                    Molecule Sketch
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Draw the structure students must name. It is
                                    shown as the question's diagram.
                                </p>
                                <MoleculeEditor
                                    value={data.prompt_smiles}
                                    onChange={(smiles) =>
                                        setData('prompt_smiles', smiles)
                                    }
                                />
                                {data.prompt_smiles && (
                                    <p className="text-xs font-semibold text-game-correct">
                                        ✓ Structure captured — it will be saved
                                        with the question
                                    </p>
                                )}
                                <InputError message={errors.prompt_smiles} />
                            </div>
                        )}
                        {isCluePuzzle && (
                            <>
                                <div className="grid gap-2">
                                    <Label className="flex items-center gap-1.5">
                                        <ImageIcon
                                            size={14}
                                            className="text-game-primary"
                                        />
                                        Clue Pictures (4 Pics 1 Word)
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Upload four pictures that hint at the
                                        answer word. Students see them in a 2×2
                                        grid.
                                    </p>
                                    <div className="grid max-w-md grid-cols-2 gap-3">
                                        {data.clue_images.map((file, i) => (
                                            <div
                                                key={i}
                                                className="rounded-xl border border-border p-2"
                                            >
                                                <p className="mb-1 text-xs font-semibold text-muted-foreground">
                                                    Picture {i + 1}
                                                </p>
                                                <ImageUploadField
                                                    file={file}
                                                    currentUrl={
                                                        question
                                                            ?.clue_image_urls?.[
                                                            i
                                                        ] ?? null
                                                    }
                                                    onFile={(f) =>
                                                        setData(
                                                            'clue_images',
                                                            data.clue_images.map(
                                                                (cur, j) =>
                                                                    j === i
                                                                        ? f
                                                                        : cur,
                                                            ),
                                                        )
                                                    }
                                                    compact
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <InputError message={errors.clue_images} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Answer Word</Label>
                                    <Input
                                        value={data.answer_word}
                                        onChange={(e) =>
                                            setData(
                                                'answer_word',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="e.g. ALKANE"
                                        maxLength={30}
                                        className="max-w-xs font-display text-lg font-bold tracking-widest uppercase"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Students spell this from letter tiles.
                                        Letters and digits only — spaces and
                                        hyphens are ignored.
                                    </p>
                                    <InputError message={errors.choices} />
                                </div>
                            </>
                        )}
                        <div className="grid gap-2">
                            <Label>Prompt Image (optional)</Label>
                            <ImageUploadField
                                file={data.prompt_image}
                                currentUrl={question?.prompt_image_url ?? null}
                                onFile={(file) => setData('prompt_image', file)}
                            />
                            <InputError message={errors.prompt_image} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Explanation (shown after answer)</Label>
                            <textarea
                                value={data.explanation}
                                onChange={(e) =>
                                    setData('explanation', e.target.value)
                                }
                                placeholder="Explain the correct answer…"
                                rows={2}
                                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                            />
                            <InputError message={errors.explanation} />
                        </div>
                    </section>

                    {/* Choices (hidden for 4 Pics 1 Word — the answer word replaces them) */}
                    {!isCluePuzzle && (
                        <section className="space-y-4 rounded-xl border border-border bg-card p-5">
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
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addChoice}
                                    >
                                        <Plus size={14} className="mr-1" /> Add
                                    </Button>
                                )}
                            </div>

                            <div
                                className={
                                    showChoiceSketchers
                                        ? 'grid grid-cols-1 gap-4 lg:grid-cols-2'
                                        : 'space-y-4'
                                }
                            >
                                {data.choices.map((choice, i) => (
                                    <div
                                        key={i}
                                        className={`flex gap-3 rounded-xl border-2 p-3 transition-colors ${
                                            choice.is_correct
                                                ? 'border-game-correct bg-game-correct/5'
                                                : 'border-border'
                                        }`}
                                    >
                                        <div className="flex items-start pt-1">
                                            <input
                                                type="radio"
                                                name="correct_choice"
                                                checked={choice.is_correct}
                                                onChange={() => setCorrect(i)}
                                                className="cursor-pointer accent-green-500"
                                                title="Mark as correct"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            {showChoiceSketchers && (
                                                <div className="grid gap-1.5">
                                                    <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                                        <FlaskConical
                                                            size={12}
                                                            className="text-game-primary"
                                                        />
                                                        Structure for choice{' '}
                                                        {String.fromCharCode(
                                                            65 + i,
                                                        )}
                                                    </p>
                                                    <MoleculeEditor
                                                        value={
                                                            choice.choice_smiles
                                                        }
                                                        onChange={(smiles) =>
                                                            updateChoice(
                                                                i,
                                                                'choice_smiles',
                                                                smiles,
                                                            )
                                                        }
                                                    />
                                                    {choice.choice_smiles && (
                                                        <p className="text-xs font-semibold text-game-correct">
                                                            ✓ Structure captured
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            <Input
                                                placeholder={`Choice ${String.fromCharCode(65 + i)} ${showChoiceSketchers ? 'label (optional)' : 'text'}`}
                                                value={choice.choice_text}
                                                onChange={(e) =>
                                                    updateChoice(
                                                        i,
                                                        'choice_text',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            {!isStructureMode && (
                                                <ImageUploadField
                                                    file={choice.choice_image}
                                                    currentUrl={
                                                        choice.choice_image_url ??
                                                        null
                                                    }
                                                    onFile={(file) =>
                                                        updateChoice(
                                                            i,
                                                            'choice_image',
                                                            file,
                                                        )
                                                    }
                                                    compact
                                                />
                                            )}
                                            <textarea
                                                placeholder={
                                                    choice.is_correct
                                                        ? 'Feedback shown after answering, e.g. "Correct! You identified the right IUPAC name."'
                                                        : 'Feedback shown after answering, e.g. "Incorrect. The chain was numbered from the wrong end…"'
                                                }
                                                value={
                                                    choice.feedback_text ?? ''
                                                }
                                                onChange={(e) =>
                                                    updateChoice(
                                                        i,
                                                        'feedback_text',
                                                        e.target.value,
                                                    )
                                                }
                                                rows={2}
                                                maxLength={1000}
                                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                                            />
                                        </div>
                                        {data.choices.length > 2 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="mt-0.5 self-start text-destructive hover:text-destructive"
                                                onClick={() => removeChoice(i)}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <InputError message={errors.choices} />
                        </section>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button asChild variant="outline">
                            <Link href={indexUrl}>Cancel</Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || !canSubmit}
                        >
                            {processing
                                ? 'Saving…'
                                : isEdit
                                  ? 'Save Changes'
                                  : 'Create Question'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

QuestionForm.layout = {
    breadcrumbs: [
        { title: 'Admin', href: '/admin' },
        { title: 'Questions', href: '/admin/questions' },
        { title: 'Form' },
    ],
};

interface ImageUploadFieldProps {
    file: File | null;
    currentUrl: string | null;
    onFile: (file: File | null) => void;
    compact?: boolean;
}

function ImageUploadField({
    file,
    currentUrl,
    onFile,
    compact = false,
}: ImageUploadFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const shownUrl = previewUrl ?? currentUrl;

    function handleFile(selected: File | null) {
        onFile(selected);
        setPreviewUrl(selected ? URL.createObjectURL(selected) : null);
    }

    return (
        <div className="flex items-center gap-3">
            {shownUrl && (
                <img
                    src={shownUrl}
                    alt="Preview"
                    className={
                        compact
                            ? 'h-10 w-10 rounded-lg border border-border object-contain'
                            : 'h-16 w-16 rounded-xl border border-border object-contain'
                    }
                />
            )}
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                >
                    <Upload size={14} className="mr-1.5" />
                    {file
                        ? file.name
                        : shownUrl
                          ? 'Replace image'
                          : 'Upload image'}
                </Button>
                {file && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                            handleFile(null);

                            if (inputRef.current) {
                                inputRef.current.value = '';
                            }
                        }}
                    >
                        <Trash2 size={14} className="mr-1" />
                        Clear
                    </Button>
                )}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
        </div>
    );
}
