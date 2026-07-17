<?php

use App\Models\GameMode;
use App\Models\GameRoom;
use App\Models\Question;
use App\Models\Topic;
use App\Models\User;
use Spatie\Permission\Models\Role;

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

it('lets the host kick a player from a waiting room', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);
    actingAs($this->guest)->post('/battle/join', ['code' => $room->code]);

    actingAs($this->host)
        ->post("/battle/rooms/{$room->code}/kick", ['user_id' => $this->guest->id])
        ->assertRedirect();

    expect($room->players()->where('user_id', $this->guest->id)->exists())->toBeFalse();
});

it('forbids non-hosts from kicking players', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);
    actingAs($this->guest)->post('/battle/join', ['code' => $room->code]);

    actingAs($this->guest)
        ->post("/battle/rooms/{$room->code}/kick", ['user_id' => $this->host->id])
        ->assertForbidden();

    expect($room->players()->count())->toBe(2);
});

it('stops the host from kicking themselves', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);

    actingAs($this->host)
        ->post("/battle/rooms/{$room->code}/kick", ['user_id' => $this->host->id])
        ->assertUnprocessable();
});

it('blocks kicks once the battle has started', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);
    actingAs($this->guest)->post('/battle/join', ['code' => $room->code]);
    actingAs($this->guest)->post("/battle/rooms/{$room->code}/ready");
    actingAs($this->host)->post("/battle/rooms/{$room->code}/start");

    actingAs($this->host)
        ->post("/battle/rooms/{$room->code}/kick", ['user_id' => $this->guest->id])
        ->assertUnprocessable();
});

function makeAdmin(): User
{
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    return $admin;
}

it('lets an admin observe a room without appearing as a player', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);
    $admin = makeAdmin();

    actingAs($admin)
        ->get("/battle/rooms/{$room->code}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('battle/room')
            ->where('is_observer', true)
            ->has('players', 1));

    expect($room->players()->where('user_id', $admin->id)->exists())->toBeFalse();
});

it('sends admins straight to observer mode when they use a join code', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);
    $admin = makeAdmin();

    actingAs($admin)
        ->post('/battle/join', ['code' => $room->code])
        ->assertRedirect(route('battle.rooms.show', $room));

    expect($room->players()->where('user_id', $admin->id)->exists())->toBeFalse();
});

it('removes an admin from the roster if they were previously a player', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);

    // Admin ended up in the roster before observer mode existed
    $admin = makeAdmin();
    $room->players()->create([
        'user_id' => $admin->id,
        'joined_at' => now(),
    ]);

    actingAs($admin)
        ->get("/battle/rooms/{$room->code}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('is_observer', true)
            ->has('players', 1));

    expect($room->players()->where('user_id', $admin->id)->exists())->toBeFalse();
});

it('keeps an admin as a normal host in a room they created', function (): void {
    $admin = makeAdmin();
    $room = createRoom($admin, $this->gameMode, $this->topic);

    actingAs($admin)
        ->get("/battle/rooms/{$room->code}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('is_observer', false)
            ->has('players', 1));

    expect($room->players()->where('user_id', $admin->id)->exists())->toBeTrue();
});

it('lets an observing admin chat in the room', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);
    $admin = makeAdmin();

    actingAs($admin)
        ->postJson("/battle/rooms/{$room->code}/chat", ['body' => 'Behave, everyone 👀'])
        ->assertOk()
        ->assertJsonPath('body', 'Behave, everyone 👀');

    actingAs($admin)
        ->getJson("/battle/rooms/{$room->code}/chat")
        ->assertOk();
});

it('lets an observing admin watch rounds but keeps players auto-joining', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);
    actingAs($this->guest)->post('/battle/join', ['code' => $room->code]);
    actingAs($this->guest)->post("/battle/rooms/{$room->code}/ready");
    actingAs($this->host)->post("/battle/rooms/{$room->code}/start");

    $admin = makeAdmin();

    // Admin can open a started room and poll rounds
    actingAs($admin)
        ->get("/battle/rooms/{$room->code}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('is_observer', true));
    actingAs($admin)
        ->getJson("/battle/rooms/{$room->code}/round")
        ->assertOk();

    // A regular player still cannot spectate a started room
    $stranger = User::factory()->create();
    actingAs($stranger)
        ->get("/battle/rooms/{$room->code}")
        ->assertRedirect(route('battle.lobby'));
});

it('lets room members chat and stores the history', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);
    actingAs($this->guest)->post('/battle/join', ['code' => $room->code]);

    actingAs($this->host)
        ->postJson("/battle/rooms/{$room->code}/chat", ['body' => 'Good luck!'])
        ->assertOk()
        ->assertJsonPath('body', 'Good luck!')
        ->assertJsonPath('user_id', $this->host->id);

    actingAs($this->guest)
        ->postJson("/battle/rooms/{$room->code}/chat", ['body' => 'You too 🔥']);

    $history = actingAs($this->guest)
        ->getJson("/battle/rooms/{$room->code}/chat")
        ->assertOk()
        ->json('messages');

    expect($history)->toHaveCount(2)
        ->and($history[0]['body'])->toBe('Good luck!')
        ->and($history[1]['body'])->toBe('You too 🔥')
        ->and($history[1]['name'])->toBe($this->guest->name);
});

it('keeps outsiders from reading or writing room chat', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);
    $outsider = User::factory()->create();

    actingAs($outsider)
        ->postJson("/battle/rooms/{$room->code}/chat", ['body' => 'hi'])
        ->assertForbidden();

    actingAs($outsider)
        ->getJson("/battle/rooms/{$room->code}/chat")
        ->assertForbidden();
});

it('blocks chat spammers for 5 minutes', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);

    foreach (range(1, 8) as $i) {
        actingAs($this->host)
            ->postJson("/battle/rooms/{$room->code}/chat", ['body' => "message {$i}"])
            ->assertOk();
    }

    // Ninth message inside the burst window triggers the block
    actingAs($this->host)
        ->postJson("/battle/rooms/{$room->code}/chat", ['body' => 'spam'])
        ->assertStatus(429);

    // Still blocked even after the burst window has passed
    $this->travel(1)->minute();
    actingAs($this->host)
        ->postJson("/battle/rooms/{$room->code}/chat", ['body' => 'still spam?'])
        ->assertStatus(429);

    // The block lifts after 5 minutes
    $this->travel(5)->minutes();
    actingAs($this->host)
        ->postJson("/battle/rooms/{$room->code}/chat", ['body' => 'back again'])
        ->assertOk();
});

it('rejects empty or oversized chat messages', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);

    actingAs($this->host)
        ->postJson("/battle/rooms/{$room->code}/chat", ['body' => ''])
        ->assertUnprocessable();

    actingAs($this->host)
        ->postJson("/battle/rooms/{$room->code}/chat", ['body' => str_repeat('a', 501)])
        ->assertUnprocessable();
});

it('serves a player profile summary for the in-game popup', function (): void {
    actingAs($this->guest)
        ->getJson("/players/{$this->host->username}/summary")
        ->assertOk()
        ->assertJsonPath('player.username', $this->host->username)
        ->assertJsonStructure([
            'player' => ['id', 'name', 'username', 'avatar_path', 'xp_total', 'joined_at'],
            'stats' => ['games_played', 'games_completed', 'best_score', 'avg_score', 'accuracy', 'fastest_correct_seconds'],
        ]);
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

it('lets the host set the maximum players when creating a room', function (): void {
    actingAs($this->host)->post('/battle/rooms', [
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'max_players' => 5,
    ]);

    expect(GameRoom::latest('id')->firstOrFail()->max_players)->toBe(5);
});

it('defaults max players to 100 when not provided', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);

    expect($room->max_players)->toBe(100);
});

it('rejects a max players value outside the allowed range', function (int $maxPlayers): void {
    actingAs($this->host)->post('/battle/rooms', [
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'max_players' => $maxPlayers,
    ])->assertSessionHasErrors('max_players');
})->with([1, 101, 0, -3]);

it('blocks joining a room that is already full', function (): void {
    actingAs($this->host)->post('/battle/rooms', [
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'max_players' => 2,
    ]);
    $room = GameRoom::latest('id')->firstOrFail();

    actingAs($this->guest)->post('/battle/join', ['code' => $room->code]);

    $third = User::factory()->create();

    actingAs($third)
        ->post('/battle/join', ['code' => $room->code])
        ->assertStatus(422);

    expect($room->players()->count())->toBe(2);
});

it('creates a room with a name, color, and battle type', function (): void {
    actingAs($this->host)->post('/battle/rooms', [
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'name' => 'Friday Chem Showdown',
        'color' => 'lime',
        'battle_type' => 'team',
    ]);

    $room = GameRoom::latest('id')->firstOrFail();

    expect($room->name)->toBe('Friday Chem Showdown')
        ->and($room->color)->toBe('lime')
        ->and($room->battle_type)->toBe('team');
});

it('falls back to a default battle name and single type', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);

    expect($room->name)->toBe("{$this->host->name}'s Battle")
        ->and($room->battle_type)->toBe('single')
        ->and($room->color)->toBe('purple');
});

it('rejects an invalid battle color or type', function (): void {
    actingAs($this->host)->post('/battle/rooms', [
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'color' => 'neon-pink',
        'battle_type' => 'royale',
    ])->assertSessionHasErrors(['color', 'battle_type']);
});

it('auto-assigns balanced teams in a team battle', function (): void {
    actingAs($this->host)->post('/battle/rooms', [
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'battle_type' => 'team',
    ]);
    $room = GameRoom::latest('id')->firstOrFail();

    expect($room->players()->where('user_id', $this->host->id)->value('team'))->toBe('red');

    actingAs($this->guest)->post('/battle/join', ['code' => $room->code]);

    expect($room->players()->where('user_id', $this->guest->id)->value('team'))->toBe('blue');

    $third = User::factory()->create();

    actingAs($third)->post('/battle/join', ['code' => $room->code]);

    expect($room->players()->where('user_id', $third->id)->value('team'))->toBe('red');
});

it('lets a player switch teams while waiting', function (): void {
    actingAs($this->host)->post('/battle/rooms', [
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'battle_type' => 'team',
    ]);
    $room = GameRoom::latest('id')->firstOrFail();

    actingAs($this->guest)->post('/battle/join', ['code' => $room->code]);
    actingAs($this->guest)->post("/battle/rooms/{$room->code}/team", ['team' => 'red']);

    expect($room->players()->where('user_id', $this->guest->id)->value('team'))->toBe('red');
});

it('rejects switching teams in a single battle', function (): void {
    $room = createRoom($this->host, $this->gameMode, $this->topic);

    actingAs($this->host)
        ->post("/battle/rooms/{$room->code}/team", ['team' => 'blue'])
        ->assertStatus(422);
});

it('requires both teams to have players before starting', function (): void {
    actingAs($this->host)->post('/battle/rooms', [
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'battle_type' => 'team',
    ]);
    $room = GameRoom::latest('id')->firstOrFail();

    actingAs($this->guest)->post('/battle/join', ['code' => $room->code]);
    // Everyone piles onto red, leaving blue empty
    actingAs($this->guest)->post("/battle/rooms/{$room->code}/team", ['team' => 'red']);
    actingAs($this->guest)->post("/battle/rooms/{$room->code}/ready");

    actingAs($this->host)
        ->post("/battle/rooms/{$room->code}/start")
        ->assertStatus(422);

    expect($room->fresh()->status)->toBe('waiting');
});
it('sets capacity from the chosen team format', function (): void {
    actingAs($this->host)->post('/battle/rooms', [
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'battle_type' => 'team',
        'team_size' => 25,
    ]);

    expect(GameRoom::latest('id')->firstOrFail()->max_players)->toBe(50);
});

it('rejects a team size outside the fixed formats', function (int $teamSize): void {
    actingAs($this->host)->post('/battle/rooms', [
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'battle_type' => 'team',
        'team_size' => $teamSize,
    ])->assertSessionHasErrors('team_size');
})->with([2, 4, 26, 50]);

it('defaults a team battle to 5v5', function (): void {
    actingAs($this->host)->post('/battle/rooms', [
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'battle_type' => 'team',
    ]);

    expect(GameRoom::latest('id')->firstOrFail()->max_players)->toBe(10);
});

it('ignores max_players for team battles and uses the format instead', function (): void {
    actingAs($this->host)->post('/battle/rooms', [
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'battle_type' => 'team',
        'team_size' => 3,
        'max_players' => 80,
    ]);

    expect(GameRoom::latest('id')->firstOrFail()->max_players)->toBe(6);
});

it('blocks switching to a full team in a 3v3', function (): void {
    actingAs($this->host)->post('/battle/rooms', [
        'game_mode_id' => $this->gameMode->id,
        'topic_id' => $this->topic->id,
        'battle_type' => 'team',
        'team_size' => 3,
    ]);
    $room = GameRoom::latest('id')->firstOrFail();

    // Host is on red; fill red to the 3-player cap
    User::factory(2)->create()->each(fn (User $user) => $room->players()->create([
        'user_id' => $user->id,
        'team' => 'red',
        'joined_at' => now(),
    ]));

    actingAs($this->guest)->post('/battle/join', ['code' => $room->code]);

    expect($room->players()->where('user_id', $this->guest->id)->value('team'))->toBe('blue');

    actingAs($this->guest)
        ->post("/battle/rooms/{$room->code}/team", ['team' => 'red'])
        ->assertStatus(422);

    expect($room->players()->where('user_id', $this->guest->id)->value('team'))->toBe('blue');
});
