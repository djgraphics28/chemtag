import { useEffect } from 'react';

const MUTE_KEY = 'chemtag_muted';

const INTERACTIVE_SELECTOR =
    'a, button, [role="button"], [role="menuitem"], [role="tab"], input, select, [data-slot="sidebar-menu-button"], summary, label';

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
    if (typeof window === 'undefined') {
        return null;
    }

    if (!sharedCtx || sharedCtx.state === 'closed') {
        const Ctor =
            window.AudioContext ??
            (window as unknown as { webkitAudioContext?: typeof AudioContext })
                .webkitAudioContext;

        if (!Ctor) {
            return null;
        }

        sharedCtx = new Ctor();
    }

    if (sharedCtx.state === 'suspended') {
        sharedCtx.resume().catch(() => undefined);
    }

    return sharedCtx;
}

/** Short two-tone blip — quiet enough to sit under the gameplay sounds. */
function playClickBlip(): void {
    const ctx = getCtx();

    if (!ctx) {
        return;
    }

    const now = ctx.currentTime;
    const notes = [
        { freq: 660, at: 0, dur: 0.05 },
        { freq: 990, at: 0.03, dur: 0.07 },
    ];

    for (const { freq, at, dur } of notes) {
        const osc = ctx.createOscillator();
        const amp = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        amp.gain.setValueAtTime(0, now + at);
        amp.gain.linearRampToValueAtTime(0.035, now + at + 0.008);
        amp.gain.exponentialRampToValueAtTime(0.0001, now + at + dur);
        osc.connect(amp).connect(ctx.destination);
        osc.start(now + at);
        osc.stop(now + at + dur + 0.05);
    }
}

/**
 * Plays a game-style blip for every click on an interactive element while
 * mounted. Reads the mute preference on each click so the in-game mute
 * toggle applies immediately.
 */
export function useUiClickSounds(): void {
    useEffect(() => {
        const onClick = (event: MouseEvent) => {
            if (localStorage.getItem(MUTE_KEY) === '1') {
                return;
            }

            const target = event.target;

            if (
                target instanceof Element &&
                target.closest(INTERACTIVE_SELECTOR)
            ) {
                playClickBlip();
            }
        };

        document.addEventListener('click', onClick, true);

        return () => document.removeEventListener('click', onClick, true);
    }, []);
}
