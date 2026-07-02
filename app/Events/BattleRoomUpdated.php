<?php

namespace App\Events;

use App\Models\GameRoom;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired whenever waiting-room state changes: joins, leaves, ready toggles.
 * Ships the authoritative player list so clients simply replace local state.
 */
class BattleRoomUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /** @param array<int, array<string, mixed>> $players */
    public function __construct(
        public string $roomCode,
        public array $players,
        public string $status,
    ) {}

    public function broadcastOn(): array
    {
        return [new PresenceChannel('battle.'.$this->roomCode)];
    }

    public function broadcastAs(): string
    {
        return 'room.updated';
    }
}
