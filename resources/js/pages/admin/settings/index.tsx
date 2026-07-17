import { Head, useForm } from '@inertiajs/react';
import { ImageIcon, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

interface SettingsProps {
    settings: {
        app_name: string;
        app_tagline: string | null;
        app_logo_path: string | null;
        app_favicon_path: string | null;
        footer_text: string | null;
        games_locked: string | null;
    };
}

export default function SettingsIndex({ settings }: SettingsProps) {
    const { data, setData, post, processing, errors } = useForm({
        app_name: settings.app_name ?? '',
        app_tagline: settings.app_tagline ?? '',
        footer_text: settings.footer_text ?? '',
        app_logo: null as File | null,
        app_favicon: null as File | null,
        remove_logo: false,
        remove_favicon: false,
        games_locked: settings.games_locked === '1',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/settings', { forceFormData: true, preserveScroll: true });
    }

    return (
        <>
            <Head title="System Settings" />

            <div className="max-w-2xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        System Settings
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Branding and identity for the whole application
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Identity */}
                    <section className="space-y-5 rounded-2xl border border-border bg-card p-6">
                        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            Identity
                        </h2>

                        <div className="grid gap-2">
                            <Label htmlFor="app_name">Project name</Label>
                            <Input
                                id="app_name"
                                value={data.app_name}
                                onChange={(e) =>
                                    setData('app_name', e.target.value)
                                }
                                placeholder="ChemTag"
                                required
                                maxLength={60}
                            />
                            <InputError message={errors.app_name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="app_tagline">Tagline</Label>
                            <Input
                                id="app_tagline"
                                value={data.app_tagline}
                                onChange={(e) =>
                                    setData('app_tagline', e.target.value)
                                }
                                placeholder="Master Organic Chemistry Naming"
                                maxLength={120}
                            />
                            <InputError message={errors.app_tagline} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="footer_text">Footer text</Label>
                            <Input
                                id="footer_text"
                                value={data.footer_text}
                                onChange={(e) =>
                                    setData('footer_text', e.target.value)
                                }
                                placeholder="© ChemTag · Built for STEM Education"
                                maxLength={160}
                            />
                            <InputError message={errors.footer_text} />
                        </div>
                    </section>

                    {/* Branding images */}
                    <section className="space-y-6 rounded-2xl border border-border bg-card p-6">
                        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            Branding
                        </h2>

                        <ImageField
                            label="Logo"
                            hint="PNG, JPG, SVG or WebP · max 2 MB · shown in the sidebar and login page"
                            accept="image/png,image/jpeg,image/svg+xml,image/webp"
                            currentUrl={settings.app_logo_path}
                            file={data.app_logo}
                            removed={data.remove_logo}
                            error={errors.app_logo}
                            onFile={(f) =>
                                setData((d) => ({
                                    ...d,
                                    app_logo: f,
                                    remove_logo: false,
                                }))
                            }
                            onRemove={() =>
                                setData((d) => ({
                                    ...d,
                                    app_logo: null,
                                    remove_logo: true,
                                }))
                            }
                        />

                        <ImageField
                            label="Favicon"
                            hint="PNG, ICO or SVG · max 512 KB · shown in the browser tab"
                            accept="image/png,image/x-icon,image/svg+xml"
                            currentUrl={settings.app_favicon_path}
                            file={data.app_favicon}
                            removed={data.remove_favicon}
                            error={errors.app_favicon}
                            onFile={(f) =>
                                setData((d) => ({
                                    ...d,
                                    app_favicon: f,
                                    remove_favicon: false,
                                }))
                            }
                            onRemove={() =>
                                setData((d) => ({
                                    ...d,
                                    app_favicon: null,
                                    remove_favicon: true,
                                }))
                            }
                        />
                    </section>

                    {/* Game access */}
                    <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
                        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            Game Access
                        </h2>

                        <label
                            htmlFor="games_locked"
                            className="flex cursor-pointer items-start gap-3"
                        >
                            <Checkbox
                                id="games_locked"
                                checked={data.games_locked}
                                onCheckedChange={(checked) =>
                                    setData('games_locked', checked === true)
                                }
                                className="mt-0.5"
                            />
                            <span className="grid gap-1">
                                <span className="text-sm font-medium text-foreground">
                                    Lock games
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    While locked, players cannot open the game
                                    or battle pages — they see a “games are
                                    locked” notice instead. Admins keep full
                                    access.
                                </span>
                            </span>
                        </label>
                        <InputError message={errors.games_locked} />
                    </section>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>
                            {processing && <Spinner />}
                            Save settings
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

SettingsIndex.layout = {
    breadcrumbs: [{ title: 'Admin', href: '/admin' }, { title: 'Settings' }],
};

interface ImageFieldProps {
    label: string;
    hint: string;
    accept: string;
    currentUrl: string | null;
    file: File | null;
    removed: boolean;
    error?: string;
    onFile: (file: File | null) => void;
    onRemove: () => void;
}

function ImageField({
    label,
    hint,
    accept,
    currentUrl,
    file,
    removed,
    error,
    onFile,
    onRemove,
}: ImageFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const shownUrl = previewUrl ?? (removed ? null : currentUrl);

    function handleFile(f: File | null) {
        onFile(f);
        setPreviewUrl(f ? URL.createObjectURL(f) : null);
    }

    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                    {shownUrl ? (
                        <img
                            src={shownUrl}
                            alt={`${label} preview`}
                            className="h-full w-full object-contain"
                        />
                    ) : (
                        <ImageIcon
                            size={20}
                            className="text-muted-foreground"
                        />
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => inputRef.current?.click()}
                    >
                        <Upload size={14} className="mr-1.5" />
                        {file ? file.name : `Upload ${label.toLowerCase()}`}
                    </Button>
                    {(shownUrl || file) && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                                handleFile(null);
                                onRemove();

                                if (inputRef.current) {
inputRef.current.value = '';
}
                            }}
                        >
                            <Trash2 size={14} className="mr-1" />
                            Remove
                        </Button>
                    )}
                </div>
            </div>
            <p className="text-xs text-muted-foreground">{hint}</p>
            <InputError message={error} />
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
        </div>
    );
}
