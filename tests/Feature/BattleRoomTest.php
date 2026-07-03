<?php

use App\Models\GameMode;
use App\Models\GameRoom;
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

    $this->host = User::factory()->create();
    $this->guest = User::factory()->create();

    // Seed questions for battles
    foreach (range(1, 5) as $i) {
        $question = Question::create([
            'game_mode_id' => $this->gameMode->id,
            'topic_id' => $this->topic->id,
            'prompt_text' => "Battle question {$i}?",
            'points' => 100,
            'time_limit_seconds' => 20,
            'is_active' => true,
            'created_by' => $this->host->id,
        ]);

        foreach (range(1, 3) as $c) {
            $question->choices()->create([
                'choice_text' => "Choice {$c}",
                'is_correct' => $c === 1,
                'sort_order' => $c,
            ]);
        }
    }
});

function createRoom($host, $gameMode, $topic): GameRoom
{
    actingAs($host)->post('/battle/rooms', [
        'game_mode_id' => $gameMode->id,
        'topic_id' => $topic->id,
    ]);

    return GameRoom::latest('id')->firstOrFail();
}

it('creates a room and auto-joins the host', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);

    expect($room->status)->toBe('waiting')
        ->and($room->code)->toHaveLength(6)
        ->and($room->players()->count())->toBe(1)
        ->and($room->players()->first()->user_id)->toBe($this->host->id);
});

it('lets another player join with the room code', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);

    actingAs($this->guest)
        ->post('/battle/join', ['code' => $room->code])
        ->assertRedirect(route('battle.rooms.show', $room));

    expect($room->players()->count())->toBe(2);
});

it('rejects joining an unknown room code', function (): void {
    actingAs($this->guest)
        ->post('/battle/join', ['code' => 'ZZZZZZ'])
        ->assertSessionHas('error');
});

it('toggles ready state', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);
    actingAs($this->guest)->post('/battle/join', ['code' => $room->code]);

    actingAs($this->guest)->post("/battle/rooms/{$room->code}/ready");

    expect($room->players()->where('user_id', $this->guest->id)->first()->is_ready)->toBeTrue();
});

it('blocks non-hosts from starting the battle', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);
    actingAs($this->guest)->post('/battle/join', ['code' => $room->code]);

    actingAs($this->guest)
        ->post("/battle/rooms/{$room->code}/start")
        ->assertForbidden();
});

it('requires at least two players to start', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);

    actingAs($this->host)
        ->post("/battle/rooms/{$room->code}/start")
        ->assertStatus(422);
});

it('requires all non-host players to be ready', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);
    actingAs($this->guest)->post('/battle/join', ['code' => $room->code]);

    actingAs($this->host)
        ->post("/battle/rooms/{$room->code}/start")
        ->assertStatus(422);
});

it('starts the battle and schedules round one', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);
    actingAs($this->guest)->post('/battle/join', ['code' => $room->code]);
    actingAs($this->guest)->post("/battle/rooms/{$room->code}/ready");

    actingAs($this->host)->post("/battle/rooms/{$room->code}/start");

    $room->refresh();
    expect($room->status)->toBe('in_progress')
        ->and($room->rounds()->count())->toBe(5);

    $first = $room->rounds()->where('round_number', 1)->first();
    expect($first->started_at)->not->toBeNull()
        ->and($first->ends_at)->not->toBeNull();

    $second = $room->rounds()->where('round_number', 2)->first();
    expect($second->started_at)->toBeNull();
});

function startedBattle($test): GameRoom
{
    $room = createRoom($test->host, $test->gameMode, $test->topic);
    actingAs($test->guest)->post('/battle/join', ['code' => $room->code]);
    actingAs($test->guest)->post("/battle/rooms/{$room->code}/ready");
    actingAs($test->host)->post("/battle/rooms/{$room->code}/start");

    // Fast-forward past the countdown so the round is answerable
    $room->refresh();
    $round = $room->rounds()->where('round_number', 1)->first();
    $round->update(['started_at' => now()->subSeconds(2), 'ends_at' => now()->addSeconds(18)]);

    return $room;
}

it('serves the current round without leaking is_correct', function (): void {
    $room = startedBattle($this);

    $response = actingAs($this->host)
        ->get("/battle/rooms/{$room->code}/round")
        ->assertOk()
        ->json();

    expect($response['round']['question']['prompt_text'])->toContain('Battle question');
    expect($response['round']['choices'])->toHaveCount(3);

    foreach ($response['round']['choices'] as $choice) {
        expect($choice)->not->toHaveKey('is_correct');
    }
});

it('scores a correct answer with speed bonus and updates the player score', function (): void {
    $room = startedBattle($this);
    $round = $room->rounds()->where('round_number', 1)->with('question.choices')->first();
    $correct = $round->question->choices->firstWhere('is_correct', true);

    $response = actingAs($this->host)
        ->postJson("/battle/rooms/{$room->code}/answers", ['choice_id' => $correct->id])
        ->assertOk()
        ->json();

    expect($response['is_correct'])->toBeTrue()
        ->and($response['points_earned'])->toBeGreaterThanOrEqual(100);

    expect($room->players()->where('user_id', $this->host->id)->first()->score)
        ->toBe($response['points_earned']);
});

it('rejects answering the same round twice', function (): void {
    $room = startedBattle($this);
    $round = $room->rounds()->where('round_number', 1)->with('question.choices')->first();
    $correct = $round->question->choices->firstWhere('is_correct', true);

    actingAs($this->host)->postJson("/battle/rooms/{$room->code}/answers", ['choice_id' => $correct->id]);

    actingAs($this->host)
        ->postJson("/battle/rooms/{$room->code}/answers", ['choice_id' => $correct->id])
        ->assertStatus(422);
});

it('finalizes the round and schedules the next when everyone answers', function (): void {
    $room = startedBattle($this);
    $round = $room->rounds()->where('round_number', 1)->with('question.choices')->first();
    $correct = $round->question->choices->firstWhere('is_correct', true);
    $wrong = $round->question->choices->firstWhere('is_correct', false);

    actingAs($this->host)->postJson("/battle/rooms/{$room->code}/answers", ['choice_id' => $correct->id]);
    actingAs($this->guest)->postJson("/battle/rooms/{$room->code}/answers", ['choice_id' => $wrong->id]);

    $round->refresh();
    expect($round->completed_at)->not->toBeNull();

    $next = $room->rounds()->where('round_number', 2)->first();
    expect($next->started_at)->not->toBeNull();
});

it('advance finalizes an expired round', function (): void {
    $room = startedBattle($this);
    $round = $room->rounds()->where('round_number', 1)->first();
    $round->update(['started_at' => now()->subSeconds(30), 'ends_at' => now()->subSeconds(5)]);

    actingAs($this->host)
        ->postJson("/battle/rooms/{$room->code}/advance")
        ->assertOk();

    $round->refresh();
    expect($round->completed_at)->not->toBeNull();
});

it('finishes the room after the last round', function (): void {
    $room = startedBattle($this);

    // Complete rounds 1-4, leave round 5 active
    foreach (range(1, 5) as $number) {
        $round = $room->rounds()->where('round_number', $number)->first();
        $round->update(['started_at' => now()->subSeconds(30), 'ends_at' => now()->subSeconds(5), 'completed_at' => $number < 5 ? now() : null]);
    }

    actingAs($this->host)->postJson("/battle/rooms/{$room->code}/advance")->assertOk();

    expect($room->fresh()->status)->toBe('finished');
});

it('promotes a new host when the host leaves the waiting room', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);
    actingAs($this->guest)->post('/battle/join', ['code' => $room->code]);

    actingAs($this->host)->post("/battle/rooms/{$room->code}/leave");

    expect($room->fresh()->host_id)->toBe($this->guest->id);
});

it('deletes the room when the last player leaves', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);

    actingAs($this->host)->post("/battle/rooms/{$room->code}/leave");

    expect(GameRoom::find($room->id))->toBeNull();
});

it('blocks joining a battle that already started', function (): void {
    $room = startedBattle($this);
    $stranger = User::factory()->create();

    actingAs($stranger)
        ->post('/battle/join', ['code' => $room->code])
        ->assertStatus(422);
});
