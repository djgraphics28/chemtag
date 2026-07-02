<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BattleStarted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $roomCode,
        public int $totalRounds,
        public string $firstRoundStartsAt,
    ) {}

    public function broadcastOn(): array
    {
        return [new PresenceChannel('battle.'.$this->roomCode)];
    }

    public function broadcastAs(): string
    {
        return 'battle.started';
    }
}
