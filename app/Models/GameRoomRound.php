<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property Carbon|null $started_at
 * @property Carbon|null $ends_at
 * @property Carbon|null $completed_at
 */
class GameRoomRound extends Model
{
    protected $fillable = ['game_room_id', 'question_id', 'round_number', 'started_at', 'ends_at', 'completed_at'];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ends_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /** @return HasMany<GameRoomAnswer, $this> */
    public function answers(): HasMany
    {
        return $this->hasMany(GameRoomAnswer::class);
    }

    /** @return BelongsTo<GameRoom, $this> */
    public function gameRoom(): BelongsTo
    {
        return $this->belongsTo(GameRoom::class);
    }

    /** @return BelongsTo<Question, $this> */
    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
