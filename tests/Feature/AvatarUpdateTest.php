<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\actingAs;

beforeEach(function (): void {
    Storage::fake('public');
});

it('lets a user upload a profile picture', function (): void {
    $user = User::factory()->create();

    actingAs($user)
        ->post('/settings/avatar', ['avatar' => UploadedFile::fake()->image('me.png')])
        ->assertRedirect();

    $user->refresh();

    expect($user->avatar_path)->toStartWith('/storage/avatars/');
    Storage::disk('public')->assertExists(str_replace('/storage/', '', $user->avatar_path));
});

it('lets a user pick a preset avatar', function (): void {
    $user = User::factory()->create();

    actingAs($user)
        ->post('/settings/avatar', ['preset' => '/avatars/atom.svg'])
        ->assertRedirect();

    expect($user->refresh()->avatar_path)->toBe('/avatars/atom.svg');
});

it('rejects presets that are not bundled with the app', function (): void {
    $user = User::factory()->create();

    actingAs($user)
        ->post('/settings/avatar', ['preset' => '/avatars/../../.env'])
        ->assertSessionHasErrors('preset');

    expect($user->refresh()->avatar_path)->toBeNull();
});

it('requires either an upload or a preset', function (): void {
    actingAs(User::factory()->create())
        ->post('/settings/avatar', [])
        ->assertSessionHasErrors(['avatar', 'preset']);
});

it('deletes the old uploaded photo when the avatar changes', function (): void {
    $user = User::factory()->create();

    actingAs($user)->post('/settings/avatar', ['avatar' => UploadedFile::fake()->image('one.png')]);
    $firstFile = str_replace('/storage/', '', $user->refresh()->avatar_path);

    actingAs($user)->post('/settings/avatar', ['preset' => '/avatars/flask.svg']);

    Storage::disk('public')->assertMissing($firstFile);
    expect($user->refresh()->avatar_path)->toBe('/avatars/flask.svg');
});
