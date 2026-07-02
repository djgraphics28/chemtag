<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * A player locked in an answer. Correctness is intentionally NOT included —
 * only who answered, so opponents see live progress without leaking answers.
 */
class BattlePlayerAnswered implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $roomCode,
        public int $userId,
        public int $roundNumber,
        public int $answeredCount,
        public int $playerCount,
    ) {}

    public function broadcastOn(): array
    {
        return [new PresenceChannel('battle.'.$this->roomCode)];
    }

    public function broadcastAs(): string
    {
        return 'battle.player-answered';
    }
}
