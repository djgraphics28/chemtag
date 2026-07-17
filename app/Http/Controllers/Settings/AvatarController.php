<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AvatarController extends Controller
{
    /**
     * Preset avatar URLs bundled with the app, for the picker grid.
     *
     * @return list<string>
     */
    public static function presetUrls(): array
    {
        return collect(glob(public_path('avatars/*.svg')) ?: [])
            ->map(fn (string $path) => '/avatars/'.basename($path))
            ->sort()
            ->values()
            ->all();
    }

    /**
     * Set the user's avatar from an uploaded photo or a bundled preset.
     */
    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => ['nullable', 'required_without:preset', 'image', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
            'preset' => ['nullable', 'required_without:avatar', 'string', Rule::in(static::presetUrls())],
        ]);

        $user = $request->user();
        $previous = $user->avatar_path;

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->update(['avatar_path' => Storage::url($path)]);
        } else {
            $user->update(['avatar_path' => $request->string('preset')->toString()]);
        }

        $this->deleteUploadedAvatar($previous);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Avatar updated.')]);

        return back();
    }

    /**
     * Remove a previously uploaded photo file; presets are shared and stay.
     */
    private function deleteUploadedAvatar(?string $url): void
    {
        if ($url === null || ! str_starts_with($url, '/storage/avatars/')) {
            return;
        }

        Storage::disk('public')->delete(str_replace('/storage/', '', $url));
    }
}
