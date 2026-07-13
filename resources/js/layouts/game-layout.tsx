import { Head } from '@inertiajs/react';
import { Moon, Sun } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { useAppearance } from '@/hooks/use-appearance';

interface GameLayoutProps extends PropsWithChildren {
    title?: string;
}

export default function GameLayout({ children, title }: GameLayoutProps) {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';

    return (
        <>
            {title && <Head title={title} />}
            <div className="relative flex min-h-screen flex-col bg-background text-foreground">
                {/* Ambient color blobs */}
                <div
                    aria-hidden
                    className="pointer-events-none fixed inset-0 -z-10"
                >
                    <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-game-purple/10 blur-3xl" />
                    <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-game-sky/10 blur-3xl" />
                </div>

                {children}

                {/* Dark mode toggle */}
                <button
                    type="button"
                    onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
                    aria-label={
                        isDark ? 'Switch to light mode' : 'Switch to dark mode'
                    }
                    className="fixed right-4 bottom-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 text-muted-foreground shadow-lg backdrop-blur transition-colors hover:text-foreground"
                >
                    {isDark ? <Sun size={17} /> : <Moon size={17} />}
                </button>
            </div>
        </>
    );
}
