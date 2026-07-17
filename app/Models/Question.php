<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Question extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $fillable = [
        'game_mode_id', 'topic_id', 'prompt_text', 'prompt_image_path', 'prompt_smiles',
        'explanation', 'points', 'time_limit_seconds', 'is_active', 'created_by',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('prompt_image')->singleFile();
        $this->addMediaCollection('clue_images'); // 4 Pics 1 Word (pattern_clue mode)
    }

    /**
     * Clue image URLs ordered by their 1–4 grid slot.
     *
     * @return array<int, string>
     */
    public function clueImageUrls(): array
    {
        return $this->getMedia('clue_images')
            ->sortBy(fn ($media) => (int) $media->getCustomProperty('slot', 0))
            ->map(fn ($media) => $media->getUrl())
            ->values()
            ->all();
    }

    /**
     * Uppercase the word and strip anything that isn't a letter or digit,
     * so "2-Methyl propane" and "2METHYLPROPANE" compare equal.
     */
    public static function normalizeWord(string $word): string
    {
        return strtoupper((string) preg_replace('/[^A-Za-z0-9]/', '', $word));
    }

    /**
     * The normalized answer word for 4-Pics-1-Word questions.
     */
    public function clueAnswer(): ?string
    {
        $text = $this->correctChoice()?->choice_text;

        return $text === null ? null : static::normalizeWord($text);
    }

    /**
     * Shuffled letter tiles: the answer's letters plus random decoys.
     * Regenerated per request — the order never reveals the answer.
     *
     * @return array<int, string>
     */
    public function clueLetterPool(): array
    {
        $letters = str_split((string) $this->clueAnswer());

        if ($letters === [] || $letters === ['']) {
            return [];
        }

        $alphabet = str_split('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
        $poolSize = max(12, count($letters) + 4);

        while (count($letters) < $poolSize) {
            $letters[] = $alphabet[array_rand($alphabet)];
        }

        shuffle($letters);

        return $letters;
    }

    /**
     * Uploaded media URL, falling back to the legacy URL column.
     */
    public function promptImageUrl(): ?string
    {
        return $this->getFirstMediaUrl('prompt_image') ?: $this->prompt_image_path;
    }

    /** @return BelongsTo<GameMode, $this> */
    public function gameMode(): BelongsTo
    {
        return $this->belongsTo(GameMode::class);
    }

    /** @return BelongsTo<Topic, $this> */
    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
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
