import { Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const MUTE_KEY = 'chemtag_muted';

/** Speaker button that mutes/unmutes all game and UI sounds. */
export function SoundToggle({ className }: { className?: string }) {
    const [muted, setMuted] = useState<boolean>(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return localStorage.getItem(MUTE_KEY) === '1';
    });

    const toggle = (): void => {
        setMuted((prev) => {
            localStorage.setItem(MUTE_KEY, prev ? '0' : '1');

            return !prev;
        });
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className={className}
            aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
            onClick={toggle}
        >
            {muted ? (
                <VolumeX className="size-5" />
            ) : (
                <Volume2 className="size-5" />
            )}
        </Button>
    );
}
