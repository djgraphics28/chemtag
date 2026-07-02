<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $status waiting|in_progress|finished
 */
class GameRoom extends Model
{
    protected $fillable = [
        'code', 'host_id', 'game_mode_id', 'level_id', 'status', 'max_players',
    ];

    /** @return BelongsTo<User, $this> */
    public function host(): BelongsTo
    {
        return $this->belongsTo(User::class, 'host_id');
    }

    /** @return BelongsTo<GameMode, $this> */
    public function gameMode(): BelongsTo
    {
        return $this->belongsTo(GameMode::class);
    }

    /** @return BelongsTo<Level, $this> */
    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }

    /** @return HasMany<GameRoomPlayer, $this> */
    public function players(): HasMany
    {
        return $this->hasMany(GameRoomPlayer::class);
    }

    /** @return HasMany<GameRoomRound, $this> */
    public function rounds(): HasMany
    {
        return $this->hasMany(GameRoomRound::class)->orderBy('round_number');
    }
}
