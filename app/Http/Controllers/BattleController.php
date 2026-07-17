<?php

namespace App\Http\Controllers;

use App\Models\GameMode;
use App\Models\GameRoom;
use App\Models\Topic;
use App\Services\BattleRoomService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BattleController extends Controller
{
    public function __construct(private readonly BattleRoomService $service) {}

    public function lobby(Request $request): Response
    {
        $openRooms = GameRoom::where('status', 'waiting')
            ->with(['host:id,name,username', 'gameMode:id,code,title', 'topic:id,name'])
            ->withCount('players')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(fn (GameRoom $room) => [
                'code' => $room->code,
                'name' => $room->name,
                'color' => $room->color,
                'battle_type' => $room->battle_type,
                'host' => $room->host->only(['name', 'username']),
                'game_mode' => $room->gameMode->only(['code', 'title']),
                'topic' => $room->topic->only(['name']),
                'players_count' => $room->players_count,
                'max_players' => $room->max_players,
            ]);

        $myRoom = GameRoom::whereIn('status', ['waiting', 'in_progress'])
            ->whereHas('players', fn ($q) => $q->where('user_id', $request->user()->id))
            ->first();

        return Inertia::render('battle/lobby', [
            'open_rooms' => $openRooms,
            'my_room_code' => $myRoom?->code,
            'game_modes' => GameMode::where('is_active', true)->get(['id', 'code', 'title']),
            'topics' => Topic::orderBy('order')->get(['id', 'name', 'order', 'questions_per_game']),
            'player_limits' => [
                'min' => BattleRoomService::MIN_PLAYERS,
                'max_single' => BattleRoomService::MAX_PLAYERS,
                'team_sizes' => BattleRoomService::TEAM_SIZES,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $isTeam = $request->input('battle_type') === 'team';

        $validated = $request->validate([
            'game_mode_id' => ['required', 'exists:game_modes,id'],
            'topic_id' => ['required', 'exists:topics,id'],
            'max_players' => ['nullable', 'integer', 'min:'.BattleRoomService::MIN_PLAYERS, 'max:'.BattleRoomService::MAX_PLAYERS],
            'team_size' => ['nullable', 'integer', Rule::in(BattleRoomService::TEAM_SIZES)],
            'name' => ['nullable', 'string', 'max:40'],
            'color' => ['nullable', 'string', Rule::in(GameRoom::COLORS)],
            'battle_type' => ['nullable', 'string', Rule::in(['single', 'team'])],
        ]);

        // Team battles use fixed formats (3v3 … 25v25); capacity is derived, never user-set.
        $maxPlayers = $isTeam
            ? 2 * (int) ($validated['team_size'] ?? BattleRoomService::DEFAULT_TEAM_SIZE)
            : (int) ($validated['max_players'] ?? BattleRoomService::MAX_PLAYERS);

        $room = $this->service->createRoom(
            $request->user(),
            (int) $validated['game_mode_id'],
            (int) $validated['topic_id'],
            $maxPlayers,
            $validated['name'] ?? null,
            $validated['color'] ?? 'purple',
            $validated['battle_type'] ?? 'single',
        );

        return redirect()->route('battle.rooms.show', $room);
    }

    public function join(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $room = GameRoom::where('code', strtoupper($validated['code']))->first();

        if (! $room) {
            return back()->with('error', 'Room not found. Check the code and try again.');
        }

        // Admins never join the roster — they go straight to observer mode.
        if (! $request->user()->hasRole('admin')) {
            $this->service->join($room, $request->user());
        }

        return redirect()->route('battle.rooms.show', $room);
    }

    public function show(Request $request, GameRoom $room): Response|RedirectResponse
    {
        $user = $request->user();
        $isPlayer = $room->players()->where('user_id', $user->id)->exists();

        // Admins observe invisibly: no player row, so they never appear in
        // the roster — but they can watch and use the room chat. The one
        // exception is a room they host themselves (created deliberately).
        $isObserver = $user->hasRole('admin') && $room->host_id !== $user->id;

        // Clean up a roster entry left over from before (e.g. the admin
        // joined as a player previously) so they are no longer listed.
        if ($isObserver && $isPlayer) {
            $this->service->leave($room, $user);
            $isPlayer = false;

            if (! $room->exists) {
                return redirect()->route('battle.lobby');
            }
        }

        // Spectating is not supported for regular players; send them back.
        if (! $isPlayer && ! $isObserver) {
            if ($room->status !== 'waiting') {
                return redirect()->route('battle.lobby')->with('error', 'That battle has already started.');
            }

            $this->service->join($room, $user);
        }

        $room->load('gameMode:id,code,title', 'topic:id,name');

        $activeRound = $room->status === 'in_progress' ? $this->service->currentRound($room) : null;

        return Inertia::render('battle/room', [
            'room' => [
                'code' => $room->code,
                'name' => $room->name,
                'color' => $room->color,
                'battle_type' => $room->battle_type,
                'status' => $room->status,
                'host_id' => $room->host_id,
                'max_players' => $room->max_players,
                'game_mode' => $room->gameMode->only(['code', 'title']),
                'topic' => $room->topic->only(['name']),
                'total_rounds' => $room->rounds()->count(),
            ],
            'players' => $this->service->playersPayload($room),
            'scoreboard' => $room->status === 'finished' ? $this->service->scoreboard($room) : null,
            'current_round' => $activeRound ? $this->service->roundPayload($activeRound, $user) : null,
            'is_observer' => $isObserver,
        ]);
    }

    public function ready(Request $request, GameRoom $room): RedirectResponse
    {
        $this->service->toggleReady($room, $request->user());

        return back();
    }

    public function team(Request $request, GameRoom $room): RedirectResponse
    {
        $validated = $request->validate([
            'team' => ['required', 'string', Rule::in(GameRoom::TEAMS)],
        ]);

        $this->service->switchTeam($room, $request->user(), $validated['team']);

        return back();
    }

    public function chatIndex(Request $request, GameRoom $room): JsonResponse
    {
        return response()->json([
            'messages' => $this->service->chatMessages($room, $request->user()),
        ]);
    }

    public function chatStore(Request $request, GameRoom $room): JsonResponse
    {
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:500'],
        ]);

        return response()->json(
            $this->service->sendChatMessage($room, $request->user(), $validated['body'])
        );
    }

    public function kick(Request $request, GameRoom $room): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer'],
        ]);

        $this->service->kick($room, $request->user(), (int) $validated['user_id']);

        return back();
    }

    public function leave(Request $request, GameRoom $room): RedirectResponse
    {
        $this->service->leave($room, $request->user());

        return redirect()->route('battle.lobby');
    }

    public function start(Request $request, GameRoom $room): RedirectResponse
    {
        $this->service->start($room, $request->user());

        return back();
    }

    public function round(Request $request, GameRoom $room): JsonResponse
    {
        abort_unless(
            $room->players()->where('user_id', $request->user()->id)->exists()
                || $request->user()->hasRole('admin'),
            403
        );

        $round = $this->service->currentRound($room);

        if (! $round) {
            return response()->json([
                'round' => null,
                'is_finished' => $room->status === 'finished',
                'scoreboard' => $this->service->scoreboard($room),
            ]);
        }

        return response()->json([
            'round' => $this->service->roundPayload($round, $request->user()),
            'is_finished' => false,
        ]);
    }

    public function answer(Request $request, GameRoom $room): JsonResponse
    {
        abort_unless($room->players()->where('user_id', $request->user()->id)->exists(), 403);

        $validated = $request->validate([
            'choice_id' => ['nullable', 'integer'],
            'word' => ['nullable', 'string', 'max:60'],
        ]);

        $result = $this->service->submitAnswer($room, $request->user(), $validated['choice_id'] ?? null, $validated['word'] ?? null);

        return response()->json($result);
    }

    public function advance(Request $request, GameRoom $room): JsonResponse
    {
        abort_unless(
            $room->players()->where('user_id', $request->user()->id)->exists()
                || $request->user()->hasRole('admin'),
            403
        );

        $this->service->advanceIfExpired($room);

        return response()->json(['ok' => true]);
    }
}
