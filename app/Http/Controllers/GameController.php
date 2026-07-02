<?php

namespace App\Http\Controllers;

use App\Models\GameMode;
use App\Models\GameSession;
use App\Models\Level;
use App\Services\GameSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GameController extends Controller
{
    public function __construct(private readonly GameSessionService $service) {}

    public function levels(Request $request): Response
    {
        $user = $request->user();
        $modes = GameMode::where('is_active', true)->get(['id', 'code', 'title', 'description', 'icon']);
        $levels = Level::orderBy('order')->get();

        $bestScores = GameSession::where('user_id', $user->id)
            ->whereIn('status', ['completed', 'failed'])
            ->selectRaw('level_id, MAX(score) as best_score')
            ->groupBy('level_id')
            ->pluck('best_score', 'level_id');

        return Inertia::render('game/level-map', [
            'modes' => $modes,
            'levels' => $levels->map(fn (Level $level) => [
                'id' => $level->id,
                'name' => $level->name,
                'order' => $level->order,
                'difficulty' => $level->difficulty,
                'unlock_score_threshold' => $level->unlock_score_threshold,
                'best_score' => $bestScores->get($level->id, 0),
                'is_unlocked' => $user->xp_total >= $level->unlock_score_threshold,
            ]),
            'user_xp' => $user->xp_total,
        ]);
    }

    public function startSession(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'game_mode_id' => ['required', 'exists:game_modes,id'],
            'level_id' => ['required', 'exists:levels,id'],
        ]);

        $level = Level::findOrFail($validated['level_id']);

        abort_if(
            $request->user()->xp_total < $level->unlock_score_threshold,
            403,
            'Level not yet unlocked.'
        );

        $session = GameSession::create([
            'user_id' => $request->user()->id,
            'game_mode_id' => $validated['game_mode_id'],
            'level_id' => $validated['level_id'],
            'score' => 0,
            'lives_remaining' => 3,
            'streak_count' => 0,
            'status' => 'in_progress',
            'started_at' => now(),
        ]);

        return redirect()->route('game.sessions.show', $session);
    }

    public function play(Request $request, GameSession $session): Response|RedirectResponse
    {
        abort_if($session->user_id !== $request->user()->id, 403);

        if ($session->status !== 'in_progress') {
            return redirect()->route('game.sessions.results', $session);
        }

        $session->load('gameMode', 'level');
        $nextQuestion = $this->service->getNextQuestion($session);

        if (! $nextQuestion) {
            $session->update(['status' => 'completed', 'ended_at' => now()]);

            return redirect()->route('game.sessions.results', $session);
        }

        return Inertia::render('game/play', [
            'session' => [
                'id' => $session->id,
                'score' => $session->score,
                'lives_remaining' => $session->lives_remaining,
                'streak_count' => $session->streak_count,
                'status' => $session->status,
                'game_mode' => $session->gameMode->only(['id', 'code', 'title']),
                'level' => $session->level->only(['id', 'name', 'order']),
            ],
            ...$this->service->formatQuestion($nextQuestion, $session),
        ]);
    }

    public function currentQuestion(Request $request, GameSession $session): JsonResponse
    {
        abort_if($session->user_id !== $request->user()->id, 403);
        abort_if($session->status !== 'in_progress', 422, 'Session is not in progress.');

        $nextQuestion = $this->service->getNextQuestion($session);

        if (! $nextQuestion) {
            return response()->json(['question' => null, 'is_complete' => true]);
        }

        return response()->json($this->service->formatQuestion($nextQuestion, $session));
    }

    public function results(Request $request, GameSession $session): Response
    {
        abort_if($session->user_id !== $request->user()->id, 403);

        $session->load('gameMode', 'level', 'answers');

        $total = $this->service->getTotalQuestions($session);
        $correctCount = $session->answers->where('is_correct', true)->count();
        $accuracy = $total > 0 ? round(($correctCount / $total) * 100) : 0;

        $stars = match (true) {
            $accuracy >= 100 => 3,
            $accuracy >= 60 => 2,
            $session->status === 'failed' && $correctCount === 0 => 0,
            default => 1,
        };

        $xpEarned = (int) round($session->score * 0.1);

        return Inertia::render('game/results', [
            'session' => [
                'id' => $session->id,
                'score' => $session->score,
                'status' => $session->status,
                'game_mode' => $session->gameMode->only(['id', 'code', 'title']),
                'level' => $session->level->only(['id', 'name', 'order']),
            ],
            'stats' => [
                'correct_count' => $correctCount,
                'total_questions' => $total,
                'accuracy' => $accuracy,
                'stars' => $stars,
                'xp_earned' => $xpEarned,
            ],
        ]);
    }

    public function leaderboard(Request $request): Response
    {
        $levels = Level::orderBy('order')->get(['id', 'name', 'order']);
        $levelId = $request->integer('level_id', 0);

        $query = GameSession::where('status', 'completed')
            ->with('user:id,name,username,avatar_path')
            ->selectRaw('user_id, MAX(score) as best_score')
            ->groupBy('user_id')
            ->orderByDesc('best_score')
            ->limit(10);

        if ($levelId) {
            $query->where('level_id', $levelId);
        }

        $topPlayers = $query->get()->map(fn ($row) => [
            'user' => $row->user?->only(['id', 'name', 'username', 'avatar_path']),
            'best_score' => $row->best_score,
        ])->filter(fn ($r) => $r['user'] !== null)->values();

        $user = $request->user();
        $allRankedIds = GameSession::where('status', 'completed')
            ->when($levelId, fn ($q) => $q->where('level_id', $levelId))
            ->selectRaw('user_id, MAX(score) as best_score')
            ->groupBy('user_id')
            ->orderByDesc('best_score')
            ->pluck('user_id');

        $rankIndex = $allRankedIds->search($user->id);
        $userRank = $rankIndex !== false ? $rankIndex + 1 : null;

        return Inertia::render('game/leaderboard', [
            'topPlayers' => $topPlayers,
            'userRank' => $userRank,
            'levels' => $levels,
            'selectedLevelId' => $levelId ?: null,
        ]);
    }
}
