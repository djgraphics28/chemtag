<?php

use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Role;

use function Pest\Laravel\actingAs;

beforeEach(function (): void {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
});

// The settings cache outlives the per-test database transaction.
afterEach(fn () => Cache::forget('app_settings'));

it('shows the locked page to players when games are locked', function (): void {
    Setting::set('games_locked', '1');

    actingAs(User::factory()->create())
        ->get('/game/topics')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('game/locked'));
});

it('locks the battle section too', function (): void {
    Setting::set('games_locked', '1');

    actingAs(User::factory()->create())
        ->get('/battle')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('game/locked'));
});

it('rejects game API calls while locked', function (): void {
    Setting::set('games_locked', '1');

    actingAs(User::factory()->create())
        ->postJson('/game/sessions', ['game_mode_id' => 1, 'topic_id' => 1])
        ->assertStatus(423);
});

it('keeps games open for admins while locked', function (): void {
    Setting::set('games_locked', '1');

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    actingAs($admin)
        ->get('/game/topics')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('game/topics'));
});

it('lets players in when games are unlocked', function (): void {
    actingAs(User::factory()->create())
        ->get('/game/topics')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('game/topics'));
});

it('lets the admin toggle the lock from system settings', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    actingAs($admin)
        ->post('/admin/settings', ['app_name' => 'ChemTag', 'games_locked' => true])
        ->assertRedirect();

    expect(Setting::gamesLocked())->toBeTrue();

    actingAs($admin)
        ->post('/admin/settings', ['app_name' => 'ChemTag', 'games_locked' => false])
        ->assertRedirect();

    expect(Setting::gamesLocked())->toBeFalse();
});
