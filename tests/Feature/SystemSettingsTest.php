<?php

use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

use function Pest\Laravel\actingAs;

beforeEach(function (): void {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');
});

it('shows the settings page to admins', function (): void {
    actingAs($this->admin)
        ->get('/admin/settings')
        ->assertOk();
});

it('blocks non-admins from settings', function (): void {
    actingAs(User::factory()->create())
        ->get('/admin/settings')
        ->assertForbidden();
});

it('updates text settings', function (): void {
    actingAs($this->admin)
        ->post('/admin/settings', [
            'app_name' => 'ChemTag Pro',
            'app_tagline' => 'Learn faster',
            'footer_text' => '© 2026 ChemTag Pro',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(Setting::get('app_name'))->toBe('ChemTag Pro')
        ->and(Setting::get('app_tagline'))->toBe('Learn faster')
        ->and(Setting::get('footer_text'))->toBe('© 2026 ChemTag Pro');
});

it('uploads a logo and stores its public url', function (): void {
    Storage::fake('public');

    actingAs($this->admin)
        ->post('/admin/settings', [
            'app_name' => 'ChemTag',
            'app_logo' => UploadedFile::fake()->image('logo.png', 200, 200),
        ])
        ->assertRedirect();

    $logo = Setting::get('app_logo_path');
    expect($logo)->toStartWith('/storage/branding/');
    Storage::disk('public')->assertExists(str_replace('/storage/', '', $logo));
});

it('removes the logo when requested', function (): void {
    Storage::fake('public');
    Setting::set('app_logo_path', '/storage/branding/old-logo.png');
    Storage::disk('public')->put('branding/old-logo.png', 'fake');

    actingAs($this->admin)
        ->post('/admin/settings', [
            'app_name' => 'ChemTag',
            'remove_logo' => true,
        ])
        ->assertRedirect();

    expect(Setting::get('app_logo_path'))->toBeNull();
    Storage::disk('public')->assertMissing('branding/old-logo.png');
});

it('rejects an oversized logo', function (): void {
    actingAs($this->admin)
        ->post('/admin/settings', [
            'app_name' => 'ChemTag',
            'app_logo' => UploadedFile::fake()->image('logo.png')->size(3000),
        ])
        ->assertSessionHasErrors('app_logo');
});

it('falls back to defaults when nothing is saved', function (): void {
    expect(Setting::get('app_name'))->toBe('ChemTag')
        ->and(Setting::get('app_logo_path'))->toBeNull();
});

it('shares branding with all inertia pages', function (): void {
    Setting::set('app_name', 'Renamed App');

    actingAs($this->admin)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->where('name', 'Renamed App')
            ->where('branding.app_name', 'Renamed App')
        );
});
