import { Head, Link } from '@inertiajs/react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Shown instead of any game/battle page while the admin has games locked.
 */
export default function Locked() {
    return (
        <>
            <Head title="Games Locked" />

            <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-16 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-game-purple/15 text-game-purple">
                    <Lock size={36} />
                </div>

                <div className="space-y-2">
                    <h1 className="font-display text-2xl font-bold text-foreground">
                        Games are locked
                    </h1>
                    <p className="max-w-sm text-sm text-muted-foreground">
                        An administrator has temporarily locked the games.
                        Please check back later or ask your teacher when play
                        will reopen.
                    </p>
                </div>

                <Button asChild>
                    <Link href="/dashboard">Back to dashboard</Link>
                </Button>
            </div>
        </>
    );
}

Locked.layout = {
    breadcrumbs: [{ title: 'Games Locked' }],
};
