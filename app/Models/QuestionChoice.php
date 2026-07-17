<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class QuestionChoice extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $fillable = ['question_id', 'choice_text', 'choice_image_path', 'choice_smiles', 'is_correct', 'feedback_text', 'sort_order'];

    protected function casts(): array
    {
        return ['is_correct' => 'boolean'];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('choice_image')->singleFile();
    }

    /**
     * Uploaded media URL, falling back to the legacy URL column.
     */
    public function choiceImageUrl(): ?string
    {
        return $this->getFirstMediaUrl('choice_image') ?: $this->choice_image_path;
    }

    /** @return BelongsTo<Question, $this> */
    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
