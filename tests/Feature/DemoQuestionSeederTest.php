<?php

use App\Models\GameMode;
use App\Models\GameSession;
use App\Models\Question;
use App\Models\Topic;
use App\Models\User;
use Database\Seeders\DemoQuestionSeeder;
use Database\Seeders\GameModeSeeder;
use Database\Seeders\TopicSeeder;

use function Pest\Laravel\actingAs;

beforeEach(function (): void {
    User::factory()->create();
    $this->seed([GameModeSeeder::class, TopicSeeder::class]);
});

it('seeds every Clue Hunter question with a structure for the clue tiles', function (): void {
    $this->seed(DemoQuestionSeeder::class);

    $clueMode = GameMode::where('code', 'pattern_clue')->firstOrFail();
    $clueQuestions = Question::where('game_mode_id', $clueMode->id)->get();

    expect($clueQuestions)->not->toBeEmpty()
        ->and($clueQuestions->every(fn (Question $q) => $q->prompt_smiles !== null))->toBeTrue();

    $pentane = $clueQuestions->firstWhere('prompt_text', 'A five-carbon straight-chain alkane. Which compound is it?');

    expect($pentane->prompt_smiles)->toBe('CCCCC');
});

it('serves the structure to the player so the clue tiles can render', function (): void {
    $this->seed(DemoQuestionSeeder::class);

    $clueMode = GameMode::where('code', 'pattern_clue')->firstOrFail();
    $topic = Topic::where('name', 'Alkanes Basics')->firstOrFail();
    $player = User::factory()->create();

    actingAs($player)->post('/game/sessions', [
        'game_mode_id' => $clueMode->id,
        'topic_id' => $topic->id,
    ]);
    $session = GameSession::latest('id')->firstOrFail();

    $payload = actingAs($player)
        ->get("/game/sessions/{$session->id}/question")
        ->assertOk()
        ->json();

    expect($payload['question']['prompt_smiles'])->not->toBeNull()
        ->and($payload['question']['letters'])->not->toBeEmpty();
});

it('backfills the structure on Clue Hunter questions seeded before SMILES existed', function (): void {
    $clueMode = GameMode::where('code', 'pattern_clue')->firstOrFail();
    $topic = Topic::where('name', 'Alkanes Basics')->firstOrFail();

    $question = Question::create([
        'game_mode_id' => $clueMode->id,
        'topic_id' => $topic->id,
        'prompt_text' => 'A five-carbon straight-chain alkane. Which compound is it?',
        'points' => 100,
        'time_limit_seconds' => 20,
        'is_active' => true,
        'created_by' => User::first()->id,
    ]);

    $this->seed(DemoQuestionSeeder::class);

    expect($question->fresh()->prompt_smiles)->toBe('CCCCC');
});
