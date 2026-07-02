<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property string $status in_progress|completed|failed
 * @property Carbon|null $started_at
 * @property Carbon|null $ended_at
 */
class GameSession extends Model
{
    protected $fillable = [
        'user_id', 'game_mode_id', 'level_id', 'score',
        'lives_remaining', 'streak_count', 'status', 'started_at', 'ended_at',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
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

    /** @return HasMany<GameSessionAnswer, $this> */
    public function answers(): HasMany
    {
        return $this->hasMany(GameSessionAnswer::class);
    }
}
