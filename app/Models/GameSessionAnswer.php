<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameSessionAnswer extends Model
{
    protected $fillable = [
        'game_session_id', 'question_id', 'selected_choice_id',
        'is_correct', 'time_taken_seconds', 'points_earned',
    ];

    protected function casts(): array
    {
        return ['is_correct' => 'boolean'];
    }

    /** @return BelongsTo<GameSession, $this> */
    public function gameSession(): BelongsTo
    {
        return $this->belongsTo(GameSession::class);
    }

    /** @return BelongsTo<Question, $this> */
    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    /** @return BelongsTo<QuestionChoice, $this> */
    public function selectedChoice(): BelongsTo
    {
        return $this->belongsTo(QuestionChoice::class, 'selected_choice_id');
    }
}
