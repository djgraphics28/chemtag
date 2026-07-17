<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameRoomMessage extends Model
{
    protected $fillable = ['game_room_id', 'user_id', 'body'];

    /** @return BelongsTo<GameRoom, $this> */
    public function gameRoom(): BelongsTo
    {
        return $this->belongsTo(GameRoom::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Shared shape for the chat endpoint and the broadcast event.
     *
     * @return array<string, mixed>
     */
    public function toChatPayload(): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'name' => $this->user->name,
            'avatar_path' => $this->user->avatar_path,
            'body' => $this->body,
            'sent_at' => $this->created_at->toIso8601String(),
        ];
    }
}
