<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    /**
     * Default values used when a key has not been persisted yet.
     *
     * @var array<string, string|null>
     */
    public const DEFAULTS = [
        'app_name' => 'ChemTag',
        'app_tagline' => 'Master Organic Chemistry Naming',
        'app_logo_path' => null,
        'app_favicon_path' => null,
        'footer_text' => '© ChemTag · Built for STEM Education',
        'games_locked' => '0',
    ];

    public static function gamesLocked(): bool
    {
        return static::get('games_locked') === '1';
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        return static::allCached()[$key] ?? $default ?? static::DEFAULTS[$key] ?? null;
    }

    public static function set(string $key, ?string $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
        Cache::forget('app_settings');
    }

    /**
     * All persisted settings merged over defaults, cached for an hour.
     *
     * @return array<string, string|null>
     */
    public static function allCached(): array
    {
        return Cache::remember('app_settings', 3600, fn () => array_merge(
            static::DEFAULTS,
            static::query()->whereNotNull('value')->pluck('value', 'key')->all(),
        ));
    }
}
