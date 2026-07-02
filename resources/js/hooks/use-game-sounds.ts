import { useCallback, useEffect, useRef, useState } from 'react';

const MUTE_KEY = 'chemtag_muted';

type Note = { freq: number; at: number; dur: number; type?: OscillatorType; gain?: number };

export function useGameSounds() {
    const ctxRef = useRef<AudioContext | null>(null);
    const [muted, setMuted] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem(MUTE_KEY) === '1';
    });
    const mutedRef = useRef(muted);
    mutedRef.current = muted;

    useEffect(() => {
        return () => {
            ctxRef.current?.close().catch(() => undefined);
        };
    }, []);

    const getCtx = useCallback((): AudioContext | null => {
        if (typeof window === 'undefined') return null;
        if (!ctxRef.current || ctxRef.current.state === 'closed') {
            const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!Ctor) return null;
            ctxRef.current = new Ctor();
        }
        if (ctxRef.current.state === 'suspended') {
            ctxRef.current.resume().catch(() => undefined);
        }
        return ctxRef.current;
    }, []);

    const playNotes = useCallback(
        (notes: Note[]) => {
            if (mutedRef.current) return;
            const ctx = getCtx();
            if (!ctx) return;

            const now = ctx.currentTime;
            for (const { freq, at, dur, type = 'sine', gain = 0.12 } of notes) {
                const osc = ctx.createOscillator();
                const amp = ctx.createGain();
                osc.type = type;
                osc.frequency.value = freq;
                amp.gain.setValueAtTime(0, now + at);
                amp.gain.linearRampToValueAtTime(gain, now + at + 0.015);
                amp.gain.exponentialRampToValueAtTime(0.0001, now + at + dur);
                osc.connect(amp).connect(ctx.destination);
                osc.start(now + at);
                osc.stop(now + at + dur + 0.05);
            }
        },
        [getCtx],
    );

    /** Rising arpeggio — pitch climbs with the streak for escalating reward. */
    const playCorrect = useCallback(
        (streak = 0) => {
            const shift = Math.min(streak, 6) * 40;
            playNotes([
                { freq: 523 + shift, at: 0, dur: 0.14, type: 'triangle' },
                { freq: 659 + shift, at: 0.09, dur: 0.14, type: 'triangle' },
                { freq: 784 + shift, at: 0.18, dur: 0.22, type: 'triangle', gain: 0.14 },
            ]);
        },
        [playNotes],
    );

    const playWrong = useCallback(() => {
        playNotes([
            { freq: 196, at: 0, dur: 0.22, type: 'sawtooth', gain: 0.08 },
            { freq: 147, at: 0.12, dur: 0.3, type: 'sawtooth', gain: 0.08 },
        ]);
    }, [playNotes]);

    const playTick = useCallback(() => {
        playNotes([{ freq: 880, at: 0, dur: 0.06, type: 'square', gain: 0.04 }]);
    }, [playNotes]);

    const playTimeout = useCallback(() => {
        playNotes([
            { freq: 440, at: 0, dur: 0.15, type: 'square', gain: 0.07 },
            { freq: 330, at: 0.15, dur: 0.15, type: 'square', gain: 0.07 },
            { freq: 220, at: 0.3, dur: 0.35, type: 'square', gain: 0.07 },
        ]);
    }, [playNotes]);

    const playLevelComplete = useCallback(() => {
        playNotes([
            { freq: 523, at: 0, dur: 0.16, type: 'triangle' },
            { freq: 659, at: 0.12, dur: 0.16, type: 'triangle' },
            { freq: 784, at: 0.24, dur: 0.16, type: 'triangle' },
            { freq: 1047, at: 0.36, dur: 0.45, type: 'triangle', gain: 0.16 },
        ]);
    }, [playNotes]);

    const playGameOver = useCallback(() => {
        playNotes([
            { freq: 392, at: 0, dur: 0.25, type: 'triangle', gain: 0.1 },
            { freq: 330, at: 0.22, dur: 0.25, type: 'triangle', gain: 0.1 },
            { freq: 262, at: 0.44, dur: 0.5, type: 'triangle', gain: 0.1 },
        ]);
    }, [playNotes]);

    const toggleMuted = useCallback(() => {
        setMuted((prev) => {
            localStorage.setItem(MUTE_KEY, prev ? '0' : '1');
            return !prev;
        });
    }, []);

    return { muted, toggleMuted, playCorrect, playWrong, playTick, playTimeout, playLevelComplete, playGameOver };
}
