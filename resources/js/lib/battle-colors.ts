export type BattleColor = 'purple' | 'coral' | 'sky' | 'lime' | 'amber';

export const battleColors: Record<
    BattleColor,
    { label: string; solid: string; soft: string; border: string; ring: string }
> = {
    purple: {
        label: 'Lavender',
        solid: 'bg-game-purple',
        soft: 'bg-game-purple/15',
        border: 'border-game-purple',
        ring: 'ring-game-purple/40',
    },
    coral: {
        label: 'Peach',
        solid: 'bg-game-coral',
        soft: 'bg-game-coral/15',
        border: 'border-game-coral',
        ring: 'ring-game-coral/40',
    },
    sky: {
        label: 'Sky',
        solid: 'bg-game-sky',
        soft: 'bg-game-sky/20',
        border: 'border-game-sky',
        ring: 'ring-game-sky/40',
    },
    lime: {
        label: 'Mint',
        solid: 'bg-game-lime',
        soft: 'bg-game-lime/15',
        border: 'border-game-lime',
        ring: 'ring-game-lime/40',
    },
    amber: {
        label: 'Amber',
        solid: 'bg-game-warning',
        soft: 'bg-game-warning/15',
        border: 'border-game-warning',
        ring: 'ring-game-warning/40',
    },
};

export function battleColor(key: string) {
    return battleColors[key as BattleColor] ?? battleColors.purple;
}
