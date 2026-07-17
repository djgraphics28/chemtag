<?php

use App\Models\GameMode;
use App\Models\GameSession;
use App\Models\Question;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

use function Pest\Laravel\actingAs;

beforeEach(function (): void {
    Storage::fake('public');

    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');

    $this->clueMode = GameMode::firstOrCreate(
        ['code' => 'pattern_clue'],
        ['title' => 'Clue Hunter', 'description' => '', 'icon' => null, 'is_active' => true]
    );
    $this->topic = Topic::firstOrCreate(
        ['name' => 'Alkanes Basics'],
        ['order' => 1, 'questions_per_game' => 5]
    );
});

function makeClueQuestion($test, string $answer = 'ALKANE'): Question
{
    $question = Question::create([
        'game_mode_id' => $test->clueMode->id,
        'topic_id' => $test->topic->id,
        'prompt_text' => 'What links these four pictures?',
        'points' => 100,
        'time_limit_seconds' => 30,
        'is_active' => true,
        'created_by' => $test->admin->id,
    ]);
    $question->choices()->create(['choice_text' => $answer, 'is_correct' => true, 'sort_order' => 0]);

    return $question;
}

it('creates a 4-pics question with clue images and an answer word', function (): void {
    actingAs($this->admin)->post('/admin/questions', [
        'game_mode_id' => $this->clueMode->id,
        'topic_id' => $this->topic->id,
        'prompt_text' => 'What links these pictures?',
        'points' => 100,
        'time_limit_seconds' => 30,
        'is_active' => true,
        'clue_images' => [
            UploadedFile::fake()->image('clue-1.png'),
            UploadedFile::fake()->image('clue-2.png'),
            UploadedFile::fake()->image('clue-3.png'),
            UploadedFile::fake()->image('clue-4.png'),
        ],
        'choices' => [
            ['choice_text' => 'ALKANE', 'is_correct' => true, 'sort_order' => 0],
        ],
    ])->assertRedirect(route('admin.questions.index'));

    $question = Question::latest('id')->firstOrFail();

    expect($question->clueImageUrls())->toHaveCount(4)
        ->and($question->clueAnswer())->toBe('ALKANE');
});

it('serves letters and clue images but never the choices', function (): void {
    makeClueQuestion($this);
    $player = User::factory()->create();

    actingAs($player)->post('/game/sessions', [
        'game_mode_id' => $this->clueMode->id,
        'topic_id' => $this->topic->id,
    ]);
    $session = GameSession::latest('id')->firstOrFail();

    $payload = actingAs($player)
        ->get("/game/sessions/{$session->id}/question")
        ->assertOk()
        ->json();

    expect($payload['choices'])->toBe([])
        ->and($payload['question']['word_length'])->toBe(6)
        ->and(count($payload['question']['letters']))->toBeGreaterThanOrEqual(12);

    // Pool must contain every letter of the answer (with multiplicity)
    $pool = $payload['question']['letters'];

    foreach (str_split('ALKANE') as $letter) {
        $index = array_search($letter, $pool, true);
        expect($index)->not->toBeFalse();
        unset($pool[$index]);
        $pool = array_values($pool);
    }
});

it('reveals a hint letter and deducts the cost from the score', function (): void {
    makeClueQuestion($this);
    $player = User::factory()->create();

    actingAs($player)->post('/game/sessions', [
        'game_mode_id' => $this->clueMode->id,
        'topic_id' => $this->topic->id,
    ]);
    $session = GameSession::latest('id')->firstOrFail();
    $session->update(['score' => 100]);

    actingAs($player)
        ->postJson("/game/sessions/{$session->id}/hint", ['position' => 2])
        ->assertOk()
        ->assertJsonPath('position', 2)
        ->assertJsonPath('letter', 'K') // ALKANE
        ->assertJsonPath('score', 75);

    expect($session->fresh()->score)->toBe(75);
});

it('never lets a hint push the score below zero', function (): void {
    makeClueQuestion($this);
    $player = User::factory()->create();

    actingAs($player)->post('/game/sessions', [
        'game_mode_id' => $this->clueMode->id,
        'topic_id' => $this->topic->id,
    ]);
    $session = GameSession::latest('id')->firstOrFail();

    actingAs($player)
        ->postJson("/game/sessions/{$session->id}/hint", ['position' => 0])
        ->assertOk()
        ->assertJsonPath('letter', 'A')
        ->assertJsonPath('score', 0);
});

it('rejects hints beyond the answer length', function (): void {
    makeClueQuestion($this);
    $player = User::factory()->create();

    actingAs($player)->post('/game/sessions', [
        'game_mode_id' => $this->clueMode->id,
        'topic_id' => $this->topic->id,
    ]);
    $session = GameSession::latest('id')->firstOrFail();

    actingAs($player)
        ->postJson("/game/sessions/{$session->id}/hint", ['position' => 6])
        ->assertUnprocessable();
});

it('rejects hints for sessions belonging to another player', function (): void {
    makeClueQuestion($this);
    $player = User::factory()->create();

    actingAs($player)->post('/game/sessions', [
        'game_mode_id' => $this->clueMode->id,
        'topic_id' => $this->topic->id,
    ]);
    $session = GameSession::latest('id')->firstOrFail();

    actingAs(User::factory()->create())
        ->postJson("/game/sessions/{$session->id}/hint", ['position' => 0])
        ->assertForbidden();
});

it('scores a correct word answer with normalization', function (): void {
    makeClueQuestion($this, '2-Methyl Propane');
    $player = User::factory()->create();

    actingAs($player)->post('/game/sessions', [
        'game_mode_id' => $this->clueMode->id,
        'topic_id' => $this->topic->id,
    ]);
    $session = GameSession::latest('id')->firstOrFail();

    actingAs($player)
        ->postJson("/game/sessions/{$session->id}/answers", [
            'word' => '2methylpropane',
            'time_taken_seconds' => 5,
        ])
        ->assertOk()
        ->assertJsonPath('is_correct', true)
        ->assertJsonPath('timed_out', false);

    expect($session->fresh()->score)->toBeGreaterThan(0);
});

it('marks a wrong word incorrect and reveals the answer', function (): void {
    makeClueQuestion($this);
    $player = User::factory()->create();

    actingAs($player)->post('/game/sessions', [
        'game_mode_id' => $this->clueMode->id,
        'topic_id' => $this->topic->id,
    ]);
    $session = GameSession::latest('id')->firstOrFail();

    actingAs($player)
        ->postJson("/game/sessions/{$session->id}/answers", [
            'word' => 'ALKENE',
            'time_taken_seconds' => 5,
        ])
        ->assertOk()
        ->assertJsonPath('is_correct', false)
        ->assertJsonPath('timed_out', false)
        ->assertJsonPath('correct_word', 'ALKANE');

    expect($session->fresh()->lives_remaining)->toBeLessThan(3);
});
