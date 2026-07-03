<?php

use App\Models\GameMode;
use App\Models\GameSession;
use App\Models\Question;
use App\Models\Topic;
use App\Models\User;

use function Pest\Laravel\actingAs;

beforeEach(function (): void {
    $this->user = User::factory()->create();

    $this->gameMode = GameMode::firstOrCreate(
        ['code' => 'structure_to_name'],
        ['title' => 'Name It Right', 'description' => '', 'icon' => null, 'is_active' => true]
    );
    $this->topic = Topic::firstOrCreate(
        ['name' => 'Alkanes Basics'],
        ['order' => 1, 'questions_per_game' => 5]
    );

    foreach (range(1, 8) as $i) {
        $question = Question::create([
            'game_mode_id' => $this->gameMode->id,
            'topic_id' => $this->topic->id,
            'prompt_text' => "Question {$i}?",
            'points' => 100,
            'time_limit_seconds' => 20,
            'is_active' => true,
            'created_by' => $this->user->id,
        ]);

        foreach (range(1, 4) as $c) {
            $question->choices()->create([
                'choice_text' => "Choice {$c}",
                'is_correct' => $c === 1,
                'feedback_text' => $c === 1 ? 'Correct! Well done.' : "Incorrect. Choice {$c} is wrong.",
                'sort_order' => $c,
            ]);
        }
    }
});

function startSession($test): GameSession
{
    actingAs($test->user)->post('/game/sessions', [
        'game_mode_id' => $test->gameMode->id,
        'topic_id' => $test->topic->id,
    ]);

    return GameSession::latest('id')->firstOrFail();
}

it('draws a random question set limited by the topic questions_per_game', function (): void {
    $session = startSession($this);

    expect($session->question_ids)->toHaveCount(5)
        ->and($session->question_ids)->toBe(array_unique($session->question_ids));
});

it('draws different question sets across many plays', function (): void {
    // With 8 questions choose 5 ordered, two identical draws in 10 tries is
    // astronomically unlikely if the order is truly random.
    $draws = collect(range(1, 10))
        ->map(fn () => startSession($this)->question_ids)
        ->map(fn ($ids) => implode(',', $ids))
        ->unique();

    expect($draws->count())->toBeGreaterThan(1);
});

it('serves questions following the session question order', function (): void {
    $session = startSession($this);
    $expectedFirst = $session->question_ids[0];

    actingAs($this->user)
        ->get("/game/sessions/{$session->id}/question")
        ->assertOk()
        ->assertJsonPath('question.id', $expectedFirst);
});

it('rejects answers for questions outside the session draw', function (): void {
    $session = startSession($this);

    $outsideQuestion = Question::whereNotIn('id', $session->question_ids)->first();
    $choice = $outsideQuestion->choices()->first();

    actingAs($this->user)
        ->postJson("/game/sessions/{$session->id}/answers", [
            'choice_id' => $choice->id,
            'time_taken_seconds' => 3,
        ])
        ->assertForbidden();
});

it('keeps choice feedback hidden until after answering', function (): void {
    $session = startSession($this);

    $question = actingAs($this->user)
        ->get("/game/sessions/{$session->id}/question")
        ->json();

    foreach ($question['choices'] as $choice) {
        expect($choice)->not->toHaveKey('feedback_text');
        expect($choice)->not->toHaveKey('is_correct');
    }

    $choiceId = $question['choices'][0]['id'];

    $answer = actingAs($this->user)
        ->postJson("/game/sessions/{$session->id}/answers", [
            'choice_id' => $choiceId,
            'time_taken_seconds' => 3,
        ])
        ->assertOk()
        ->json();

    expect($answer['choice_feedback'])->toHaveCount(4)
        ->and($answer['choice_feedback'][(string) $choiceId])->toContain($answer['is_correct'] ? 'Correct' : 'Incorrect');
});

it('shuffles choices between serves', function (): void {
    $session = startSession($this);

    // Ten serves of a 4-choice question: all identical orders is (1/24)^9
    $orders = collect(range(1, 10))->map(function () use ($session) {
        $response = actingAs($this->user)
            ->get("/game/sessions/{$session->id}/question")
            ->json();

        return implode(',', array_column($response['choices'], 'id'));
    })->unique();

    expect($orders->count())->toBeGreaterThan(1);
});
