<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameRoomAnswer extends Model
{
    protected $fillable = [
        'game_room_round_id', 'user_id', 'selected_choice_id',
        'is_correct', 'points_earned', 'time_taken_ms',
    ];

    protected function casts(): array
    {
        return [
            'is_correct' => 'boolean',
        ];
    }

    /** @return BelongsTo<GameRoomRound, $this> */
    public function round(): BelongsTo
    {
        return $this->belongsTo(GameRoomRound::class, 'game_room_round_id');
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<QuestionChoice, $this> */
    public function selectedChoice(): BelongsTo
    {
        return $this->belongsTo(QuestionChoice::class, 'selected_choice_id');
    }
}
