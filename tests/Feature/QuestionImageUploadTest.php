<?php

use App\Models\GameMode;
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

    $this->gameMode = GameMode::firstOrCreate(
        ['code' => 'pattern_clue'],
        ['title' => 'Clue Hunter', 'description' => '', 'icon' => null, 'is_active' => true]
    );
    $this->topic = Topic::firstOrCreate(
        ['name' => 'Alkanes Basics'],
        ['order' => 1, 'questions_per_game' => 5]
    );
});

function imageUploadPayload(array $overrides = []): array
{
    return array_merge([
        'prompt_text' => 'Identify the pattern',
        'points' => 100,
        'time_limit_seconds' => 20,
        'is_active' => true,
        'choices' => [
            ['choice_text' => 'A', 'is_correct' => true, 'sort_order' => 0],
            ['choice_text' => 'B', 'is_correct' => false, 'sort_order' => 1],
        ],
    ], $overrides);
}

it('stores an uploaded prompt image via the media library', function (): void {
    actingAs($this->admin)->post('/admin/questions', imageUploadPayload([
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'prompt_image' => UploadedFile::fake()->image('prompt.png', 300, 200),
    ]))->assertRedirect(route('admin.questions.index'));

    $question = Question::latest('id')->firstOrFail();

    expect($question->getFirstMedia('prompt_image'))->not->toBeNull()
        ->and($question->promptImageUrl())->toContain('prompt.png');
});

it('stores uploaded choice images via the media library', function (): void {
    actingAs($this->admin)->post('/admin/questions', imageUploadPayload([
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'choices' => [
            [
                'choice_text' => 'A',
                'choice_image' => UploadedFile::fake()->image('choice-a.png'),
                'is_correct' => true,
                'sort_order' => 0,
            ],
            ['choice_text' => 'B', 'is_correct' => false, 'sort_order' => 1],
        ],
    ]));

    $question = Question::latest('id')->firstOrFail();
    $first = $question->choices()->orderBy('sort_order')->first();
    $second = $question->choices()->orderBy('sort_order')->skip(1)->first();

    expect($first->choiceImageUrl())->toContain('choice-a.png')
        ->and($second->getFirstMedia('choice_image'))->toBeNull();
});

it('replaces the prompt image on update', function (): void {
    actingAs($this->admin)->post('/admin/questions', imageUploadPayload([
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'prompt_image' => UploadedFile::fake()->image('old.png'),
    ]));

    $question = Question::latest('id')->firstOrFail();
    $choices = $question->choices()->orderBy('sort_order')->get();

    actingAs($this->admin)->post("/admin/questions/{$question->id}", imageUploadPayload([
        '_method' => 'put',
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'prompt_image' => UploadedFile::fake()->image('new.png'),
        'choices' => [
            ['id' => $choices[0]->id, 'choice_text' => 'A', 'is_correct' => true, 'sort_order' => 0],
            ['id' => $choices[1]->id, 'choice_text' => 'B', 'is_correct' => false, 'sort_order' => 1],
        ],
    ]));

    $question->refresh();

    expect($question->media()->where('collection_name', 'prompt_image')->count())->toBe(1)
        ->and($question->promptImageUrl())->toContain('new.png');
});

it('falls back to the legacy image URL column when no media exists', function (): void {
    $question = Question::create([
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'prompt_text' => 'Legacy question',
        'prompt_image_path' => 'https://example.com/legacy.png',
        'points' => 100,
        'time_limit_seconds' => 20,
        'is_active' => true,
        'created_by' => $this->admin->id,
    ]);

    expect($question->promptImageUrl())->toBe('https://example.com/legacy.png');
});
