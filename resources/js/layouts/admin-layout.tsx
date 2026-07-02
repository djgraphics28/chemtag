import { Link, router, usePage } from '@inertiajs/react';
import {
    ChevronRight,
    Gamepad2,
    HelpCircle,
    LayoutDashboard,
    Layers,
    LayoutGrid,
    LogOut,
    Settings,
    Shield,
    Users,
} from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { UserInfo } from '@/components/user-info';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { logout } from '@/routes';
import { edit as editProfile } from '@/routes/profile';
import type { User } from '@/types';
import type { PropsWithChildren } from 'react';

const nav = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/roles', label: 'Roles', icon: Shield },
    { href: '/admin/questions', label: 'Questions', icon: HelpCircle },
    { href: '/admin/game-modes', label: 'Game Modes', icon: Gamepad2 },
    { href: '/admin/levels', label: 'Levels', icon: Layers },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
];

interface AdminLayoutProps extends PropsWithChildren {
    breadcrumbs?: { title: string; href?: string }[];
}

export default function AdminLayout({ children, breadcrumbs = [] }: AdminLayoutProps) {
    const page = usePage<{
        url: string;
        name: string;
        auth: { user: User | null };
        flash?: { success?: string; error?: string };
        branding?: { app_logo_path: string | null };
    }>();

    const { auth, flash, name, branding } = page.props;
    const url = page.url;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
                {/* Logo + badge */}
                <div className="flex h-14 items-center gap-2 px-4">
                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-primary text-primary-foreground font-display font-bold text-sm">
                        {branding?.app_logo_path ? (
                            <img src={branding.app_logo_path} alt={name} className="h-full w-full object-contain" />
                        ) : (
                            (name ?? 'CT').slice(0, 2).toUpperCase()
                        )}
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="text-sm font-semibold text-sidebar-foreground">{name}</span>
                        <span className="text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/40">Admin</span>
                    </div>
                </div>

                <Separator className="bg-sidebar-border" />

                {/* Nav */}
                <nav className="flex-1 space-y-0.5 p-2 pt-3">
                    {nav.map((item) => {
                        const active = item.exact ? url === item.href : url.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                    active
                                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                                }`}
                            >
                                <item.icon size={16} className="shrink-0" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="border-t border-sidebar-border p-3 space-y-1">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
                    >
                        <LayoutGrid size={14} />
                        Back to App
                    </Link>

                    {auth.user && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors">
                                    <UserInfo user={auth.user} showUsername />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top" align="start" className="w-52">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex items-center gap-2">
                                        <UserInfo user={auth.user} showUsername />
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href={editProfile()}>
                                        <Settings size={14} className="mr-2" />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href={logout()} as="button" className="w-full" onClick={() => router.flushAll()}>
                                        <LogOut size={14} className="mr-2" />
                                        Log out
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </aside>

            {/* Main content */}
            <div className="flex flex-1 flex-col min-w-0">
                <header className="flex h-14 items-center gap-2 border-b border-border px-4">
                    {breadcrumbs.length > 0 && (
                        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
                            {breadcrumbs.map((crumb, i) => (
                                <span key={i} className="flex items-center gap-1">
                                    {i > 0 && <ChevronRight size={14} />}
                                    {crumb.href ? (
                                        <Link href={crumb.href} className="hover:text-foreground transition-colors">
                                            {crumb.title}
                                        </Link>
                                    ) : (
                                        <span className="text-foreground font-medium">{crumb.title}</span>
                                    )}
                                </span>
                            ))}
                        </nav>
                    )}
                </header>
                <main className="flex-1 overflow-auto p-6">{children}</main>
            </div>
        </div>
    );
}
