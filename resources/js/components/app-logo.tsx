import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name, branding } = usePage<{
        name: string;
        branding?: { app_logo_path: string | null };
    }>().props;

    return (
        <>
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                {branding?.app_logo_path ? (
                    <img src={branding.app_logo_path} alt={name} className="h-full w-full object-contain" />
                ) : (
                    <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
                )}
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">{name}</span>
            </div>
        </>
    );
}
