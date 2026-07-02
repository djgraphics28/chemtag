import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UserFormProps {
    user?: {
        id: number;
        name: string;
        username: string;
        role: string | undefined;
        xp_total: number;
    };
    roles: string[];
}

export default function UserForm({ user, roles }: UserFormProps) {
    const isEdit = !!user;

    const { data, setData, post, put, processing, errors } = useForm({
        name: user?.name ?? '',
        username: user?.username ?? '',
        password: '',
        role: user?.role ?? roles[0] ?? 'student',
        xp_total: user?.xp_total ?? 0,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) {
            put(`/admin/users/${user!.id}`);
        } else {
            post('/admin/users');
        }
    }

    return (
        <>
            <Head title={isEdit ? 'Edit User' : 'New User'} />

            <div className="mx-auto max-w-lg space-y-6">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/admin/users">
                            <ArrowLeft size={16} />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">{isEdit ? 'Edit User' : 'New User'}</h1>
                        <p className="text-sm text-muted-foreground">{isEdit ? `Editing @${user!.username}` : 'Create a new account'}</p>
                    </div>
                </div>

                <form onSubmit={submit} className="rounded-xl border border-border bg-card p-6 space-y-5">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Jane Doe" />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" value={data.username} onChange={(e) => setData('username', e.target.value)} placeholder="jane_doe" />
                        <InputError message={errors.username} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">{isEdit ? 'New Password (leave blank to keep)' : 'Password'}</Label>
                        <PasswordInput
                            id="password"
                            name="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder={isEdit ? 'Leave blank to keep current' : 'Password'}
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="role">Role</Label>
                        <select
                            id="role"
                            value={data.role}
                            onChange={(e) => setData('role', e.target.value)}
                            className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                        >
                            {roles.map((r) => (
                                <option key={r} value={r} className="capitalize">{r}</option>
                            ))}
                        </select>
                        <InputError message={errors.role} />
                    </div>

                    {isEdit && (
                        <div className="grid gap-2">
                            <Label htmlFor="xp_total">XP Total</Label>
                            <Input
                                id="xp_total"
                                type="number"
                                min={0}
                                value={data.xp_total}
                                onChange={(e) => setData('xp_total', parseInt(e.target.value, 10))}
                            />
                            <InputError message={errors.xp_total} />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button asChild variant="outline">
                            <Link href="/admin/users">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

UserForm.layout = {
    breadcrumbs: [{ title: 'Admin', href: '/admin' }, { title: 'Users', href: '/admin/users' }, { title: 'Form' }],
};
