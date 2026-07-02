import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AdminRole } from '@/types/admin';

interface RolesIndexProps {
    roles: AdminRole[];
    permissions: string[];
}

const builtInRoles = ['admin', 'teacher', 'student'];

export default function RolesIndex({ roles, permissions }: RolesIndexProps) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editPerms, setEditPerms] = useState<string[]>([]);

    const newForm = useForm({ name: '', permissions: [] as string[] });

    function startEdit(role: AdminRole) {
        setEditingId(role.id);
        setEditPerms(role.permissions);
    }

    function cancelEdit() {
        setEditingId(null);
        setEditPerms([]);
    }

    function savePermissions(role: AdminRole) {
        router.put(`/admin/roles/${role.id}`, { permissions: editPerms }, {
            preserveScroll: true,
            onSuccess: () => cancelEdit(),
        });
    }

    function togglePerm(perm: string, current: string[], setter: (p: string[]) => void) {
        setter(current.includes(perm) ? current.filter((p) => p !== perm) : [...current, perm]);
    }

    function handleDelete(role: AdminRole) {
        if (!confirm(`Delete role "${role.name}"?`)) return;
        router.delete(`/admin/roles/${role.id}`, { preserveScroll: true });
    }

    function submitNew(e: React.FormEvent) {
        e.preventDefault();
        newForm.post('/admin/roles', { preserveScroll: true, onSuccess: () => newForm.reset() });
    }

    return (
        <>
            <Head title="Roles & Permissions" />

            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Roles & Permissions</h1>
                    <p className="text-sm text-muted-foreground">Manage access levels for the system</p>
                </div>

                {/* Roles list */}
                <div className="space-y-3">
                    {roles.map((role) => (
                        <div key={role.id} className="rounded-xl border border-border bg-card p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold capitalize text-foreground">{role.name}</span>
                                        {builtInRoles.includes(role.name) && (
                                            <Badge variant="outline" className="text-xs">Built-in</Badge>
                                        )}
                                        <span className="text-xs text-muted-foreground">{role.users_count} users</span>
                                    </div>

                                    {editingId === role.id ? (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Permissions</p>
                                            <div className="flex flex-wrap gap-2">
                                                {permissions.length === 0 && (
                                                    <p className="text-xs text-muted-foreground">No permissions defined yet.</p>
                                                )}
                                                {permissions.map((perm) => (
                                                    <button
                                                        key={perm}
                                                        type="button"
                                                        onClick={() => togglePerm(perm, editPerms, setEditPerms)}
                                                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                                            editPerms.includes(perm)
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                        }`}
                                                    >
                                                        {perm}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {role.permissions.length === 0 ? (
                                                <span className="text-xs text-muted-foreground">No permissions</span>
                                            ) : (
                                                role.permissions.map((p) => (
                                                    <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex shrink-0 gap-1">
                                    {editingId === role.id ? (
                                        <>
                                            <Button size="sm" onClick={() => savePermissions(role)}>
                                                <Save size={14} className="mr-1" /> Save
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button size="sm" variant="outline" onClick={() => startEdit(role)}>
                                                Edit Permissions
                                            </Button>
                                            {!builtInRoles.includes(role.name) && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(role)}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Create new role */}
                <form onSubmit={submitNew} className="rounded-xl border border-border bg-card p-5 space-y-4">
                    <h2 className="font-semibold text-foreground">Create New Role</h2>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Role name (e.g. moderator)"
                            value={newForm.data.name}
                            onChange={(e) => newForm.setData('name', e.target.value)}
                            className="max-w-xs"
                        />
                        <Button type="submit" disabled={newForm.processing}>
                            <Plus size={14} className="mr-1" /> Create
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

RolesIndex.layout = {
    breadcrumbs: [{ title: 'Admin', href: '/admin' }, { title: 'Roles & Permissions' }],
};
