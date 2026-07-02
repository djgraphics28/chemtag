import { Zap } from 'lucide-react';

interface XpBadgeProps {
    xp: number;
    className?: string;
}

export function XpBadge({ xp, className = '' }: XpBadgeProps) {
    return (
        <div className={`flex items-center gap-1 rounded-full bg-game-primary/20 px-2.5 py-1 text-xs font-bold text-game-primary ${className}`}>
            <Zap size={12} className="fill-game-primary" />
            <span>{xp.toLocaleString()} XP</span>
        </div>
    );
}
