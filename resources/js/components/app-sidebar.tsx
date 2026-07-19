import { usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { LayoutGrid, Map, Settings2, Swords, Trophy } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

export const mainNavItems: NavItem[] = [
    { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
    { title: 'Solo Quest', href: '/game/topics', icon: Map },
    { title: 'Battle Arena', href: '/battle', icon: Swords },
    { title: 'Leaderboard', href: '/game/leaderboard', icon: Trophy },
];

export function AppSidebar() {
    const { auth } = usePage<{ auth: { user: { roles?: string[] } | null } }>().props;
    const isAdmin = auth?.user?.roles?.includes('admin') ?? false;

    const navItems: NavItem[] = [
        ...mainNavItems,
        ...(isAdmin ? [{ title: 'Admin Panel', href: '/admin', icon: Settings2 }] : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
