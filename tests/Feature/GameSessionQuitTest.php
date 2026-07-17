<?php

use App\Models\GameMode;
use App\Models\GameSession;
use App\Models\Question;
use App\Models\Topic;
use App\Models\User;

use function Pest\Laravel\actingAs;

beforeEach(function (): void {
    $this->gameMode = GameMode::firstOrCreate(
        ['code' => 'structure_to_name'],
        ['title' => 'Name It Right', 'description' => '', 'icon' => null, 'is_active' => true]
    );
    $this->topic = Topic::firstOrCreate(
        ['name' => 'Alkanes Basics'],
        ['order' => 1, 'questions_per_game' => 5]
    );
    $this->player = User::factory()->create();

    $question = Question::create([
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'prompt_text' => 'What is CH4?',
        'points' => 100,
        'time_limit_seconds' => 20,
        'is_active' => true,
        'created_by' => $this->player->id,
    ]);
    $question->choices()->create(['choice_text' => 'Methane', 'is_correct' => true, 'sort_order' => 1]);
});

function startQuitTestSession($test): GameSession
{
    actingAs($test->player)->post('/game/sessions', [
        'game_mode_id' => $test->gameMode->id,
        'topic_id' => $test->topic->id,
    ]);

    return GameSession::latest('id')->firstOrFail();
}

it('lets a player quit an ongoing game and lands on results', function (): void {
    $session = startQuitTestSession($this);

    actingAs($this->player)
        ->post("/game/sessions/{$session->id}/quit")
        ->assertRedirect(route('game.sessions.results', $session));

    $session->refresh();

    expect($session->status)->toBe('failed')
        ->and($session->ended_at)->not->toBeNull();
});

it('leaves already finished sessions untouched when quitting again', function (): void {
    $session = startQuitTestSession($this);
    $session->update(['status' => 'completed', 'ended_at' => now()]);

    actingAs($this->player)
        ->post("/game/sessions/{$session->id}/quit")
        ->assertRedirect(route('game.sessions.results', $session));

    expect($session->fresh()->status)->toBe('completed');
});

it('forbids quitting another player\'s session', function (): void {
    $session = startQuitTestSession($this);

    actingAs(User::factory()->create())
        ->post("/game/sessions/{$session->id}/quit")
        ->assertForbidden();

    expect($session->fresh()->status)->toBe('in_progress');
});
