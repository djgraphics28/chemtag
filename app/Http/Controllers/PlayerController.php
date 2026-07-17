<?php

namespace App\Http\Controllers;

use App\Models\GameSession;
use App\Models\GameSessionAnswer;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class PlayerController extends Controller
{
    public function show(User $user): Response
    {
        $recentSessions = GameSession::where('user_id', $user->id)
            ->with('gameMode:id,code,title', 'topic:id,name')
            ->whereIn('status', ['completed', 'failed'])
            ->orderByDesc('ended_at')
            ->limit(5)
            ->get()
            ->map(fn (GameSession $s) => [
                'id' => $s->id,
                'score' => $s->score,
                'status' => $s->status,
                'game_mode' => $s->gameMode?->only(['code', 'title']),
                'topic' => $s->topic?->only(['name']),
                'ended_at' => $s->ended_at?->diffForHumans(),
            ]);

        return Inertia::render('player/show', [
            ...$this->profilePayload($user),
            'recent_sessions' => $recentSessions,
        ]);
    }

    /**
     * Compact JSON profile used by in-game player popups.
     */
    public function summary(User $user): JsonResponse
    {
        return response()->json($this->profilePayload($user));
    }

    /**
     * @return array{player: array<string, mixed>, stats: array<string, mixed>}
     */
    private function profilePayload(User $user): array
    {
        $stats = GameSession::where('user_id', $user->id)
            ->whereIn('status', ['completed', 'failed'])
            ->selectRaw('
                COUNT(*) as games_played,
                SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as games_completed,
                MAX(score) as best_score,
                AVG(score) as avg_score
            ')
            ->first();

        $answerStats = GameSessionAnswer::whereHas(
            'gameSession',
            fn ($q) => $q->where('user_id', $user->id)
        )->selectRaw('
            COUNT(*) as total_answers,
            SUM(is_correct) as correct_answers,
            MIN(CASE WHEN is_correct = 1 THEN time_taken_seconds END) as fastest_correct_seconds
        ')->first();

        $accuracy = ($answerStats->total_answers ?? 0) > 0
            ? round(($answerStats->correct_answers / $answerStats->total_answers) * 100)
            : 0;

        return [
            'player' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'avatar_path' => $user->avatar_path,
                'xp_total' => $user->xp_total,
                'joined_at' => $user->created_at->format('M Y'),
            ],
            'stats' => [
                'games_played' => (int) ($stats->games_played ?? 0),
                'games_completed' => (int) ($stats->games_completed ?? 0),
                'best_score' => (int) ($stats->best_score ?? 0),
                'avg_score' => (int) ($stats->avg_score ?? 0),
                'accuracy' => $accuracy,
                'fastest_correct_seconds' => $answerStats->fastest_correct_seconds,
            ],
        ];
    }
}
