import { Head, Link, router, useForm } from '@inertiajs/react';
import { Plus, Search, Trash2, Pencil } from 'lucide-react';
import { useRef } from 'react';
import { Tbody, Td, Th, Thead, Tr, Table } from '@/components/admin/data-table';
import { Pagination } from '@/components/admin/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { AdminUser, PaginatedData } from '@/types/admin';

interface UsersIndexProps {
    users: PaginatedData<AdminUser>;
    roles: string[];
    filters: { search?: string; role?: string };
}

const roleVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    admin: 'default',
    teacher: 'secondary',
    student: 'outline',
};

export default function UsersIndex({ users, roles, filters }: UsersIndexProps) {
    const searchRef = useRef<HTMLInputElement>(null);

    function applyFilter(patch: Record<string, string>) {
        router.get('/admin/users', { ...filters, ...patch }, { preserveScroll: true, replace: true });
    }

    function handleDelete(id: number, name: string) {
        if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
        router.delete(`/admin/users/${id}`, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Users" />

            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Users</h1>
                        <p className="text-sm text-muted-foreground">{users.total} total</p>
                    </div>
                    <Button asChild>
                        <Link href="/admin/users/create">
                            <Plus size={16} className="mr-1.5" />
                            New User
                        </Link>
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                    <div className="relative flex-1 max-w-xs">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            ref={searchRef}
                            defaultValue={filters.search}
                            placeholder="Search name or username…"
                            className="pl-8"
                            onKeyDown={(e) => e.key === 'Enter' && applyFilter({ search: searchRef.current?.value ?? '' })}
                        />
                    </div>
                    <select
                        value={filters.role ?? ''}
                        onChange={(e) => applyFilter({ role: e.target.value })}
                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                    >
                        <option value="">All roles</option>
                        {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>

                <Table>
                    <Thead>
                        <Th>Name</Th>
                        <Th>Username</Th>
                        <Th>Role</Th>
                        <Th>XP</Th>
                        <Th>Joined</Th>
                        <Th className="w-20" />
                    </Thead>
                    <Tbody>
                        {users.data.map((u) => (
                            <Tr key={u.id}>
                                <Td className="font-medium">{u.name}</Td>
                                <Td className="text-muted-foreground">@{u.username}</Td>
                                <Td>
                                    <div className="flex gap-1">
                                        {u.roles.map((r) => (
                                            <Badge key={r} variant={roleVariant[r] ?? 'outline'} className="capitalize text-xs">
                                                {r}
                                            </Badge>
                                        ))}
                                    </div>
                                </Td>
                                <Td className="tabular-nums">{u.xp_total.toLocaleString()}</Td>
                                <Td className="text-muted-foreground">{u.created_at}</Td>
                                <Td>
                                    <div className="flex items-center gap-1">
                                        <Button asChild variant="ghost" size="sm">
                                            <Link href={`/admin/users/${u.id}/edit`}>
                                                <Pencil size={14} />
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => handleDelete(u.id, u.name)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>

                <Pagination meta={users} />
            </div>
        </>
    );
}

UsersIndex.layout = {
    breadcrumbs: [{ title: 'Admin', href: '/admin' }, { title: 'Users' }],
};
