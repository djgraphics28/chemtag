<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired whenever the set of open rooms changes: a room is created, a player
 * joins or leaves, or a battle starts/finishes. Carries no payload — clients
 * re-fetch the open-room list so the lobby is always authoritative.
 */
class BattleLobbyUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function broadcastOn(): array
    {
        return [new Channel('battle-lobby')];
    }

    public function broadcastAs(): string
    {
        return 'lobby.updated';
    }
}
