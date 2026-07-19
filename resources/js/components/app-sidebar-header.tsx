import { Link, usePage } from '@inertiajs/react';
import { AppearanceToggle } from '@/components/appearance-toggle';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SoundToggle } from '@/components/sound-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useInitials } from '@/hooks/use-initials';
import type { Auth, BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const getInitials = useInitials();

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex w-full items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
                <div className="ml-auto flex items-center gap-1 md:hidden">
                    <SoundToggle />
                    <AppearanceToggle />
                    <Link
                        href={`/players/${auth.user.username}`}
                        aria-label="My profile"
                        prefetch
                        className="ml-1"
                    >
                        <Avatar className="size-8 overflow-hidden rounded-full border-2 border-game-navy">
                            <AvatarImage
                                src={auth.user.avatar_path ?? undefined}
                                alt={auth.user.name}
                            />
                            <AvatarFallback className="bg-primary/20 text-xs text-primary dark:bg-primary/30">
                                {getInitials(auth.user.name)}
                            </AvatarFallback>
                        </Avatar>
                    </Link>
                </div>
            </div>
        </header>
    );
}
