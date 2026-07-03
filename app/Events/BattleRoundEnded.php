<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Round finished (everyone answered or time expired). Safe to reveal the
 * correct choice now. Includes the live scoreboard and next-round schedule.
 */
class BattleRoundEnded implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  array<int, string>  $choiceFeedback  keyed by choice id
     * @param  array<int, array<string, mixed>>  $scoreboard
     * @param  array<int, array<string, mixed>>  $roundResults
     */
    public function __construct(
        public string $roomCode,
        public int $roundNumber,
        public int $correctChoiceId,
        public ?string $explanation,
        public array $choiceFeedback,
        public array $roundResults,
        public array $scoreboard,
        public ?int $nextRoundNumber,
        public ?string $nextRoundStartsAt,
        public bool $isFinal,
    ) {}

    public function broadcastOn(): array
    {
        return [new PresenceChannel('battle.'.$this->roomCode)];
    }

    public function broadcastAs(): string
    {
        return 'battle.round-ended';
    }
}
