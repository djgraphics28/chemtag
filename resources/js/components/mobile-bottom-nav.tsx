import { Link } from '@inertiajs/react';
import { mainNavItems } from '@/components/app-sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';

/**
 * Flutter/React Native style bottom navigation bar. Only visible on mobile;
 * desktop keeps the sidebar.
 */
export function MobileBottomNav() {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-sidebar-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
            <div className="grid grid-cols-4">
                {mainNavItems.map((item) => {
                    const isActive = isCurrentOrParentUrl(item.href);

                    return (
                        <Link
                            key={item.title}
                            href={item.href}
                            prefetch
                            className={cn(
                                'flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors',
                                isActive && 'text-primary',
                            )}
                        >
                            {item.icon && (
                                <item.icon
                                    className={cn(
                                        'size-5',
                                        isActive && 'fill-primary/15',
                                    )}
                                />
                            )}
                            <span>{item.title}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
