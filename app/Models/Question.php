<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Question extends Model
{
    protected $fillable = [
        'game_mode_id', 'level_id', 'prompt_text', 'prompt_image_path',
        'explanation', 'points', 'time_limit_seconds', 'is_active', 'created_by',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
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

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return HasMany<QuestionChoice, $this> */
    public function choices(): HasMany
    {
        return $this->hasMany(QuestionChoice::class)->orderBy('sort_order');
    }

    public function correctChoice(): ?QuestionChoice
    {
        return $this->choices()->where('is_correct', true)->first();
    }
}
