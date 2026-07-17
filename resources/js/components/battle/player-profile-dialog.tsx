import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { apiFetch } from '@/lib/api-fetch';

interface ProfileSummary {
    player: {
        id: number;
        name: string;
        username: string;
        avatar_path: string | null;
        xp_total: number;
        joined_at: string;
    };
    stats: {
        games_played: number;
        games_completed: number;
        best_score: number;
        avg_score: number;
        accuracy: number;
        fastest_correct_seconds: number | null;
    };
}

/**
 * In-game player card: fetches a compact profile for the clicked player
 * and shows it in a dialog (used in battle rooms).
 */
export function PlayerProfileDialog({
    username,
    onClose,
}: {
    /** Player to show, or null when the dialog is closed. */
    username: string | null;
    onClose: () => void;
}) {
    // Cache keyed by username so switching players never shows stale data.
    const [loaded, setLoaded] = useState<{
        username: string;
        summary: ProfileSummary;
    } | null>(null);

    useEffect(() => {
        if (!username) {
            return;
        }

        let cancelled = false;

        apiFetch<ProfileSummary>(`/players/${username}/summary`)
            .then((summary) => {
                if (!cancelled) {
                    setLoaded({ username, summary });
                }
            })
            .catch(() => undefined);

        return () => {
            cancelled = true;
        };
    }, [username]);

    const data = loaded?.username === username ? loaded.summary : null;

    const statTiles = data
        ? [
              { label: 'Games played', value: data.stats.games_played },
              { label: 'Completed', value: data.stats.games_completed },
              {
                  label: 'Best score',
                  value: data.stats.best_score.toLocaleString(),
              },
              {
                  label: 'Avg score',
                  value: data.stats.avg_score.toLocaleString(),
              },
              { label: 'Accuracy', value: `${data.stats.accuracy}%` },
              {
                  label: 'Fastest correct',
                  value:
                      data.stats.fastest_correct_seconds !== null
                          ? `${data.stats.fastest_correct_seconds}s`
                          : '—',
              },
          ]
        : [];

    return (
        <Dialog
            open={!!username}
            onOpenChange={(open) => {
                if (!open) {
                    onClose();
                }
            }}
        >
            <DialogContent className="max-w-sm">
                {data ? (
                    <>
                        <DialogHeader className="items-center text-center">
                            {data.player.avatar_path ? (
                                <img
                                    src={data.player.avatar_path}
                                    alt={data.player.name}
                                    className="mx-auto h-20 w-20 rounded-full border border-border object-cover"
                                />
                            ) : (
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-game-primary/25 text-2xl font-bold text-foreground uppercase">
                                    {data.player.name.charAt(0)}
                                </div>
                            )}
                            <DialogTitle>{data.player.name}</DialogTitle>
                            <DialogDescription>
                                @{data.player.username} ·{' '}
                                {data.player.xp_total.toLocaleString()} XP ·
                                joined {data.player.joined_at}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-2 gap-2">
                            {statTiles.map((tile) => (
                                <div
                                    key={tile.label}
                                    className="rounded-xl border border-foreground/10 bg-foreground/5 px-3 py-2.5 text-center"
                                >
                                    <p className="font-display text-lg font-extrabold text-foreground tabular-nums">
                                        {tile.value}
                                    </p>
                                    <p className="text-[11px] font-medium text-foreground/50">
                                        {tile.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader className="items-center">
                            <div className="mx-auto h-20 w-20 animate-pulse rounded-full bg-muted" />
                            <DialogTitle className="sr-only">
                                Loading player profile
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                Fetching player details…
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-2">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <div
                                    key={i}
                                    className="h-16 animate-pulse rounded-xl bg-muted"
                                />
                            ))}
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
