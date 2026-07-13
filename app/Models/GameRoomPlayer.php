<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property Carbon|null $joined_at
 */
class GameRoomPlayer extends Model
{
    protected $fillable = ['game_room_id', 'user_id', 'team', 'score', 'is_ready', 'joined_at'];

    protected function casts(): array
    {
        return [
            'is_ready' => 'boolean',
            'joined_at' => 'datetime',
        ];
    }

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
}
