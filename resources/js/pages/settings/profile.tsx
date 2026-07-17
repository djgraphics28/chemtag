import { Form, Head, router, usePage } from '@inertiajs/react';
import { Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { edit } from '@/routes/profile';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth & { user: { avatar_path?: string | null } };
    status?: string;
};

function AvatarSection({ presets }: { presets: string[] }) {
    const { auth } = usePage<PageProps>().props;
    const fileRef = useRef<HTMLInputElement>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const current = auth.user.avatar_path ?? null;

    function save(payload: { avatar?: File; preset?: string }) {
        router.post('/settings/avatar', payload, {
            forceFormData: !!payload.avatar,
            preserveScroll: true,
            onStart: () => setSaving(true),
            onFinish: () => setSaving(false),
            onSuccess: () => setErrors({}),
            onError: (e) => setErrors(e),
        });
    }

    return (
        <div className="space-y-4">
            <Heading
                variant="small"
                title="Avatar"
                description="Upload your own photo or pick one of the ready-made avatars"
            />

            <div className="flex items-center gap-4">
                {current ? (
                    <img
                        src={current}
                        alt="Your avatar"
                        className="h-16 w-16 shrink-0 rounded-full border border-border object-cover"
                    />
                ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-game-primary/25 text-xl font-bold text-foreground uppercase">
                        {auth.user.name.charAt(0)}
                    </div>
                )}

                <div className="space-y-1">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={saving}
                        onClick={() => fileRef.current?.click()}
                    >
                        <Upload size={14} className="mr-1.5" />
                        Upload photo
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        PNG, JPG or WebP · max 2 MB
                    </p>
                </div>

                <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];

                        if (file) {
                            save({ avatar: file });
                        }

                        e.target.value = '';
                    }}
                />
            </div>
            <InputError message={errors.avatar} />

            {presets.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                        Or choose an avatar
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {presets.map((preset) => (
                            <button
                                key={preset}
                                type="button"
                                disabled={saving}
                                onClick={() => save({ preset })}
                                aria-label={`Choose avatar ${preset.split('/').pop()?.replace('.svg', '')}`}
                                className={cn(
                                    'rounded-full transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                    current === preset &&
                                        'ring-2 ring-primary ring-offset-2 ring-offset-background',
                                )}
                            >
                                <img
                                    src={preset}
                                    alt=""
                                    className="h-12 w-12 rounded-full"
                                />
                            </button>
                        ))}
                    </div>
                    <InputError message={errors.preset} />
                </div>
            )}
        </div>
    );
}

export default function Profile({
    status,
    presetAvatars = [],
}: {
    status?: string;
    presetAvatars?: string[];
}) {
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <AvatarSection presets={presetAvatars} />

                <Heading
                    variant="small"
                    title="Profile"
                    description="Update your name and username"
                />

                <Form
                    {...ProfileController.update.form()}
                    options={{ preserveScroll: true }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full name</Label>
                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="Full name"
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.username}
                                    name="username"
                                    required
                                    autoComplete="username"
                                    placeholder="Username"
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.username}
                                />
                            </div>

                            {status === 'profile-updated' && (
                                <p className="text-sm font-medium text-green-600">
                                    Profile updated.
                                </p>
                            )}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [{ title: 'Profile settings', href: edit() }],
};
