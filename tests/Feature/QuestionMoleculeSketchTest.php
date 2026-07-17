<?php

use App\Models\GameMode;
use App\Models\GameSession;
use App\Models\Question;
use App\Models\Topic;
use App\Models\User;
use Spatie\Permission\Models\Role;

use function Pest\Laravel\actingAs;

beforeEach(function (): void {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');

    $this->gameMode = GameMode::firstOrCreate(
        ['code' => 'structure_to_name'],
        ['title' => 'Name It Right', 'description' => '', 'icon' => null, 'is_active' => true]
    );
    $this->topic = Topic::firstOrCreate(
        ['name' => 'Alkanes Basics'],
        ['order' => 1, 'questions_per_game' => 5]
    );
});

function questionPayload(array $overrides = []): array
{
    return array_merge([
        'prompt_text' => 'Name this compound',
        'prompt_image_path' => null,
        'explanation' => null,
        'points' => 100,
        'time_limit_seconds' => 20,
        'is_active' => true,
        'choices' => [
            ['choice_text' => 'Ethanol', 'is_correct' => true, 'sort_order' => 0],
            ['choice_text' => 'Methanol', 'is_correct' => false, 'sort_order' => 1],
        ],
    ], $overrides);
}

it('stores a sketched molecule as SMILES when creating a question', function (): void {
    actingAs($this->admin)->post('/admin/questions', questionPayload([
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'prompt_smiles' => 'CCO',
    ]))->assertRedirect(route('admin.questions.index'));

    expect(Question::latest('id')->firstOrFail()->prompt_smiles)->toBe('CCO');
});

it('updates the sketched molecule on an existing question', function (): void {
    $question = Question::create([
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'prompt_text' => 'Name this compound',
        'prompt_smiles' => 'CCO',
        'points' => 100,
        'time_limit_seconds' => 20,
        'is_active' => true,
        'created_by' => $this->admin->id,
    ]);
    $question->choices()->create(['choice_text' => 'Ethanol', 'is_correct' => true, 'sort_order' => 0]);
    $question->choices()->create(['choice_text' => 'Methanol', 'is_correct' => false, 'sort_order' => 1]);

    actingAs($this->admin)->put("/admin/questions/{$question->id}", questionPayload([
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'prompt_smiles' => 'CC(C)O',
    ]));

    expect($question->fresh()->prompt_smiles)->toBe('CC(C)O');
});

it('serves the SMILES to players during a game session', function (): void {
    $question = Question::create([
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'prompt_text' => 'Name this compound',
        'prompt_smiles' => 'CCO',
        'points' => 100,
        'time_limit_seconds' => 20,
        'is_active' => true,
        'created_by' => $this->admin->id,
    ]);
    $question->choices()->create(['choice_text' => 'Ethanol', 'is_correct' => true, 'sort_order' => 0]);
    $question->choices()->create(['choice_text' => 'Methanol', 'is_correct' => false, 'sort_order' => 1]);

    $player = User::factory()->create();

    actingAs($player)->post('/game/sessions', [
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
    ]);

    $session = GameSession::latest('id')->firstOrFail();

    actingAs($player)
        ->get("/game/sessions/{$session->id}/question")
        ->assertOk()
        ->assertJsonPath('question.prompt_smiles', 'CCO');
});

it('stores sketched structures on answer choices', function (): void {
    $structureMatch = GameMode::firstOrCreate(
        ['code' => 'name_to_structure'],
        ['title' => 'Structure Match', 'description' => '', 'icon' => null, 'is_active' => true]
    );

    actingAs($this->admin)->post('/admin/questions', questionPayload([
        'game_mode_id' => $structureMatch->id,
        'topic_id' => $this->topic->id,
        'prompt_text' => 'Which structure is ethanol?',
        'choices' => [
            ['choice_text' => null, 'choice_smiles' => 'CCO', 'is_correct' => true, 'sort_order' => 0],
            ['choice_text' => null, 'choice_smiles' => 'CO', 'is_correct' => false, 'sort_order' => 1],
        ],
    ]))->assertRedirect(route('admin.questions.index'));

    $question = Question::latest('id')->firstOrFail();

    expect($question->choices()->orderBy('sort_order')->pluck('choice_smiles')->all())
        ->toBe(['CCO', 'CO']);
});

it('serves choice SMILES to players during a game session', function (): void {
    $structureMatch = GameMode::firstOrCreate(
        ['code' => 'name_to_structure'],
        ['title' => 'Structure Match', 'description' => '', 'icon' => null, 'is_active' => true]
    );

    $question = Question::create([
        'game_mode_id' => $structureMatch->id,
        'topic_id' => $this->topic->id,
        'prompt_text' => 'Which structure is ethanol?',
        'points' => 100,
        'time_limit_seconds' => 20,
        'is_active' => true,
        'created_by' => $this->admin->id,
    ]);
    $question->choices()->create(['choice_smiles' => 'CCO', 'is_correct' => true, 'sort_order' => 0]);
    $question->choices()->create(['choice_smiles' => 'CO', 'is_correct' => false, 'sort_order' => 1]);

    $player = User::factory()->create();

    actingAs($player)->post('/game/sessions', [
        'game_mode_id' => $structureMatch->id,
        'topic_id' => $this->topic->id,
    ]);

    $session = GameSession::latest('id')->firstOrFail();

    $choices = actingAs($player)
        ->get("/game/sessions/{$session->id}/question")
        ->assertOk()
        ->json('choices');

    expect(collect($choices)->pluck('choice_smiles')->sort()->values()->all())
        ->toBe(['CCO', 'CO']);
});

it('returns to the filtered index after saving', function (): void {
    $question = Question::create([
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'prompt_text' => 'Name this compound',
        'points' => 100,
        'time_limit_seconds' => 20,
        'is_active' => true,
        'created_by' => $this->admin->id,
    ]);
    $question->choices()->create(['choice_text' => 'Ethanol', 'is_correct' => true, 'sort_order' => 0]);
    $question->choices()->create(['choice_text' => 'Methanol', 'is_correct' => false, 'sort_order' => 1]);

    actingAs($this->admin)->put("/admin/questions/{$question->id}", questionPayload([
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'filters' => [
            'search' => 'propane',
            'game_mode_id' => (string) $this->gameMode->id,
            'page' => '2',
            'topic_id' => '',
            'evil_key' => 'dropped',
        ],
    ]))->assertRedirect(route('admin.questions.index', [
        'search' => 'propane',
        'game_mode_id' => $this->gameMode->id,
        'page' => 2,
    ]));
});

it('keeps the query string when deleting from a filtered index', function (): void {
    $question = Question::create([
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'prompt_text' => 'Delete me',
        'points' => 100,
        'time_limit_seconds' => 20,
        'is_active' => true,
        'created_by' => $this->admin->id,
    ]);

    actingAs($this->admin)
        ->from('/admin/questions?search=propane&page=2')
        ->delete("/admin/questions/{$question->id}")
        ->assertRedirect('/admin/questions?search=propane&page=2');
});
