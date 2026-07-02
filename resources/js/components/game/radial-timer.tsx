interface RadialTimerProps {
    secondsLeft: number;
    total: number;
    size?: number;
    strokeWidth?: number;
}

export function RadialTimer({ secondsLeft, total, size = 72, strokeWidth = 6 }: RadialTimerProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = total > 0 ? secondsLeft / total : 0;
    const dashOffset = circumference * (1 - progress);

    const color =
        progress > 0.5
            ? 'var(--color-game-correct)'
            : progress > 0.25
              ? 'var(--color-game-warning)'
              : 'var(--color-game-danger)';

    const isUrgent = secondsLeft > 0 && secondsLeft <= 5;

    return (
        <div
            className="relative flex items-center justify-center"
            style={{
                width: size,
                height: size,
                animation: isUrgent ? 'ct-timer-pulse 1s ease-in-out infinite' : undefined,
            }}
        >
            <style>{`@keyframes ct-timer-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }`}</style>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-white/10"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
                />
            </svg>
            <span className="absolute text-sm font-bold tabular-nums" style={{ color }}>
                {secondsLeft}
            </span>
        </div>
    );
}
