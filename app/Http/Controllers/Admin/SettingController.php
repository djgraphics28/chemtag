<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/settings/index', [
            'settings' => Setting::allCached(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'app_name' => ['required', 'string', 'max:60'],
            'app_tagline' => ['nullable', 'string', 'max:120'],
            'footer_text' => ['nullable', 'string', 'max:160'],
            'app_logo' => ['nullable', 'image', 'mimes:png,jpg,jpeg,svg,webp', 'max:2048'],
            'app_favicon' => ['nullable', 'image', 'mimes:png,ico,svg', 'max:512'],
            'remove_logo' => ['boolean'],
            'remove_favicon' => ['boolean'],
            'games_locked' => ['boolean'],
        ]);

        Setting::set('app_name', $data['app_name']);
        Setting::set('app_tagline', $data['app_tagline'] ?? null);
        Setting::set('footer_text', $data['footer_text'] ?? null);
        Setting::set('games_locked', $request->boolean('games_locked') ? '1' : '0');

        $this->handleImage($request, 'app_logo', 'app_logo_path', (bool) ($data['remove_logo'] ?? false));
        $this->handleImage($request, 'app_favicon', 'app_favicon_path', (bool) ($data['remove_favicon'] ?? false));

        return back()->with('success', 'Settings saved.');
    }

    private function handleImage(Request $request, string $input, string $settingKey, bool $remove): void
    {
        $current = Setting::get($settingKey);

        if ($request->hasFile($input)) {
            $path = $request->file($input)->store('branding', 'public');
            Setting::set($settingKey, Storage::url($path));

            if ($current) {
                $this->deletePublicFile($current);
            }
        } elseif ($remove && $current) {
            Setting::set($settingKey, null);
            $this->deletePublicFile($current);
        }
    }

    private function deletePublicFile(string $url): void
    {
        $relative = str_replace('/storage/', '', $url);

        if (str_starts_with($relative, 'branding/')) {
            Storage::disk('public')->delete($relative);
        }
    }
}
