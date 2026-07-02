interface GameProgressBarProps {
    answered: number;
    total: number;
}

export function GameProgressBar({ answered, total }: GameProgressBarProps) {
    const pct = total > 0 ? (answered / total) * 100 : 0;

    return (
        <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-medium text-white/60">
                <span>
                    Q{answered + 1} of {total}
                </span>
                <span>{Math.round(pct)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                    className="h-full rounded-full bg-game-primary transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
