import { Head, Link, router, useForm } from '@inertiajs/react';
import { Download, FileUp, Plus, Search, Trash2, Pencil, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Tbody, Td, Th, Thead, Tr, Table } from '@/components/admin/data-table';
import { Pagination } from '@/components/admin/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AdminQuestion, PaginatedData } from '@/types/admin';

interface QuestionsIndexProps {
    questions: PaginatedData<AdminQuestion>;
    game_modes: { id: number; code: string; title: string }[];
    levels: { id: number; name: string; order: number }[];
    filters: { search?: string; game_mode_id?: string; level_id?: string };
}

export default function QuestionsIndex({ questions, game_modes, levels, filters }: QuestionsIndexProps) {
    const searchRef = useRef<HTMLInputElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [importOpen, setImportOpen] = useState(false);

    const importForm = useForm<{ file: File | null }>({ file: null });

    function applyFilter(patch: Record<string, string>) {
        router.get('/admin/questions', { ...filters, ...patch }, { preserveScroll: true, replace: true });
    }

    function handleDelete(id: number) {
        if (!confirm('Delete this question? This cannot be undone.')) return;
        router.delete(`/admin/questions/${id}`, { preserveScroll: true });
    }

    function handleImport(e: React.FormEvent) {
        e.preventDefault();
        importForm.post('/admin/questions/import', {
            forceFormData: true,
            onSuccess: () => {
                setImportOpen(false);
                importForm.reset();
                if (fileRef.current) fileRef.current.value = '';
            },
        });
    }

    return (
        <>
            <Head title="Questions" />

            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Questions</h1>
                        <p className="text-sm text-muted-foreground">{questions.total} total</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild>
                            <a href="/admin/questions/template" download>
                                <Download size={14} className="mr-1.5" />
                                Template
                            </a>
                        </Button>
                        <Button variant="outline" onClick={() => setImportOpen(true)}>
                            <FileUp size={14} className="mr-1.5" />
                            Import CSV
                        </Button>
                        <Button asChild>
                            <Link href="/admin/questions/create">
                                <Plus size={16} className="mr-1.5" />
                                New Question
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    <div className="relative flex-1 min-w-48 max-w-xs">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            ref={searchRef}
                            defaultValue={filters.search}
                            placeholder="Search prompt text…"
                            className="pl-8"
                            onKeyDown={(e) => e.key === 'Enter' && applyFilter({ search: searchRef.current?.value ?? '' })}
                        />
                    </div>
                    <select
                        value={filters.game_mode_id ?? ''}
                        onChange={(e) => applyFilter({ game_mode_id: e.target.value })}
                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                    >
                        <option value="">All modes</option>
                        {game_modes.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                    <select
                        value={filters.level_id ?? ''}
                        onChange={(e) => applyFilter({ level_id: e.target.value })}
                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                    >
                        <option value="">All levels</option>
                        {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                </div>

                <Table>
                    <Thead>
                        <Th>Prompt</Th>
                        <Th>Mode</Th>
                        <Th>Level</Th>
                        <Th>Pts</Th>
                        <Th>Choices</Th>
                        <Th>Status</Th>
                        <Th className="w-20" />
                    </Thead>
                    <Tbody>
                        {questions.data.map((q) => (
                            <Tr key={q.id}>
                                <Td className="max-w-xs">
                                    {q.prompt_image_path && (
                                        <span className="mr-1 text-muted-foreground text-xs">[img]</span>
                                    )}
                                    <span className="line-clamp-2 text-sm">{q.prompt_text ?? '(image only)'}</span>
                                </Td>
                                <Td>
                                    <Badge variant="secondary" className="text-xs whitespace-nowrap">{q.game_mode?.title}</Badge>
                                </Td>
                                <Td className="text-muted-foreground text-xs whitespace-nowrap">{q.level?.name}</Td>
                                <Td className="tabular-nums text-xs">{q.points}</Td>
                                <Td className="tabular-nums text-xs">{q.choices_count}</Td>
                                <Td>
                                    <Badge variant={q.is_active ? 'default' : 'outline'} className="text-xs">
                                        {q.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </Td>
                                <Td>
                                    <div className="flex items-center gap-1">
                                        <Button asChild variant="ghost" size="sm">
                                            <Link href={`/admin/questions/${q.id}/edit`}>
                                                <Pencil size={14} />
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => handleDelete(q.id)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </Td>
                            </Tr>
                        ))}
                        {questions.data.length === 0 && (
                            <Tr>
                                <Td className="text-center text-muted-foreground py-8" colSpan={7}>
                                    No questions found.
                                </Td>
                            </Tr>
                        )}
                    </Tbody>
                </Table>

                <Pagination meta={questions} />
            </div>

            {/* Import dialog */}
            {importOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setImportOpen(false)} />
                    <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
                        <div className="mb-4 flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">Import Questions</h2>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    Upload an Excel or CSV file. Download the{' '}
                                    <a href="/admin/questions/template" download className="text-primary underline underline-offset-2">
                                        Excel template
                                    </a>{' '}
                                    first — sheet 1 has the instructions, sheet 2 is the import table.
                                </p>
                            </div>
                            <button
                                onClick={() => setImportOpen(false)}
                                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleImport} encType="multipart/form-data" className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-foreground">
                                    Excel / CSV File <span className="text-destructive">*</span>
                                </label>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                                    onChange={(e) => importForm.setData('file', e.target.files?.[0] ?? null)}
                                    className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs file:font-medium file:text-foreground"
                                />
                                {importForm.errors.file && (
                                    <p className="mt-1 text-xs text-destructive">{importForm.errors.file}</p>
                                )}
                            </div>

                            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground space-y-1">
                                <p className="font-medium text-foreground">What gets imported:</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    <li>One question per row with 2–6 answer choices</li>
                                    <li>Rows with errors are skipped (others still import)</li>
                                    <li>Duplicate questions are not checked — each row creates a new question</li>
                                </ul>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                                <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={importForm.processing || !importForm.data.file}
                                >
                                    {importForm.processing ? 'Importing…' : 'Import'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

QuestionsIndex.layout = {
    breadcrumbs: [{ title: 'Admin', href: '/admin' }, { title: 'Questions' }],
};
