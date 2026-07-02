<?php

namespace App\Http\Controllers;

use App\Models\GameMode;
use App\Models\GameRoom;
use App\Models\Level;
use App\Services\BattleRoomService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BattleController extends Controller
{
    public function __construct(private readonly BattleRoomService $service) {}

    public function lobby(Request $request): Response
    {
        $openRooms = GameRoom::where('status', 'waiting')
            ->with(['host:id,name,username', 'gameMode:id,code,title', 'level:id,name'])
            ->withCount('players')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(fn (GameRoom $room) => [
                'code' => $room->code,
                'host' => $room->host->only(['name', 'username']),
                'game_mode' => $room->gameMode->only(['code', 'title']),
                'level' => $room->level->only(['name']),
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
            'levels' => Level::orderBy('order')->get(['id', 'name', 'order', 'difficulty']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'game_mode_id' => ['required', 'exists:game_modes,id'],
            'level_id' => ['required', 'exists:levels,id'],
        ]);

        $room = $this->service->createRoom(
            $request->user(),
            (int) $validated['game_mode_id'],
            (int) $validated['level_id'],
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

        $this->service->join($room, $request->user());

        return redirect()->route('battle.rooms.show', $room);
    }

    public function show(Request $request, GameRoom $room): Response|RedirectResponse
    {
        $user = $request->user();
        $isPlayer = $room->players()->where('user_id', $user->id)->exists();

        // Spectating is not supported; send non-players back to the lobby.
        if (! $isPlayer) {
            if ($room->status !== 'waiting') {
                return redirect()->route('battle.lobby')->with('error', 'That battle has already started.');
            }

            $this->service->join($room, $user);
        }

        $room->load('gameMode:id,code,title', 'level:id,name');

        $activeRound = $room->status === 'in_progress' ? $this->service->currentRound($room) : null;

        return Inertia::render('battle/room', [
            'room' => [
                'code' => $room->code,
                'status' => $room->status,
                'host_id' => $room->host_id,
                'max_players' => $room->max_players,
                'game_mode' => $room->gameMode->only(['code', 'title']),
                'level' => $room->level->only(['name']),
                'total_rounds' => $room->rounds()->count(),
            ],
            'players' => $this->service->playersPayload($room),
            'scoreboard' => $room->status === 'finished' ? $this->service->scoreboard($room) : null,
            'current_round' => $activeRound ? $this->service->roundPayload($activeRound, $user) : null,
        ]);
    }

    public function ready(Request $request, GameRoom $room): RedirectResponse
    {
        $this->service->toggleReady($room, $request->user());

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
        abort_unless($room->players()->where('user_id', $request->user()->id)->exists(), 403);

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
        ]);

        $result = $this->service->submitAnswer($room, $request->user(), $validated['choice_id'] ?? null);

        return response()->json($result);
    }

    public function advance(Request $request, GameRoom $room): JsonResponse
    {
        abort_unless($room->players()->where('user_id', $request->user()->id)->exists(), 403);

        $this->service->advanceIfExpired($room);

        return response()->json(['ok' => true]);
    }
}
