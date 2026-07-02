import { Head, Link } from '@inertiajs/react';
import { HelpCircle, Layers, TrendingUp, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { AdminUser } from '@/types/admin';

interface DashboardProps {
    stats: {
        total_users: number;
        total_questions: number;
        sessions_today: number;
        completion_rate: number;
    };
    recent_users: AdminUser[];
}

const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    admin: 'default',
    teacher: 'secondary',
    student: 'outline',
};

export default function AdminDashboard({ stats, recent_users }: DashboardProps) {
    return (
        <>
            <Head title="Admin Dashboard" />

            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">ChemTag system overview</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard icon={<Users size={20} className="text-primary" />} label="Total Users" value={stats.total_users} href="/admin/users" />
                    <StatCard icon={<HelpCircle size={20} className="text-game-correct" />} label="Questions" value={stats.total_questions} href="/admin/questions" />
                    <StatCard icon={<Layers size={20} className="text-game-warning" />} label="Sessions Today" value={stats.sessions_today} />
                    <StatCard icon={<TrendingUp size={20} className="text-game-primary" />} label="Completion Rate" value={`${stats.completion_rate}%`} />
                </div>

                {/* Recent users */}
                <div className="rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                        <h2 className="font-semibold text-foreground">Recent Users</h2>
                        <Link href="/admin/users" className="text-xs text-primary hover:underline">
                            View all →
                        </Link>
                    </div>
                    <div className="divide-y divide-border">
                        {recent_users.map((u) => (
                            <div key={u.id} className="flex items-center justify-between px-5 py-3">
                                <div>
                                    <p className="font-medium text-foreground">{u.name}</p>
                                    <p className="text-xs text-muted-foreground">@{u.username} · {u.created_at}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {u.roles.map((r) => (
                                        <Badge key={r} variant={roleBadgeVariant[r] ?? 'outline'} className="capitalize">
                                            {r}
                                        </Badge>
                                    ))}
                                    <span className="text-xs text-muted-foreground">{u.xp_total} XP</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [{ title: 'Admin' }, { title: 'Dashboard' }],
};

function StatCard({
    icon,
    label,
    value,
    href,
}: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    href?: string;
}) {
    const inner = (
        <div className="rounded-xl border border-border bg-card p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                </div>
            </div>
        </div>
    );

    return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}
