<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GameSession;
use App\Models\Question;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $totalUsers = User::count();
        $totalQuestions = Question::count();
        $sessionsToday = GameSession::whereDate('created_at', today())->count();
        $completedToday = GameSession::whereDate('created_at', today())->where('status', 'completed')->count();

        $completionRate = $sessionsToday > 0
            ? round(($completedToday / $sessionsToday) * 100)
            : 0;

        $recentUsers = User::with('roles')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'username' => $u->username,
                'xp_total' => $u->xp_total,
                'roles' => $u->roles->pluck('name'),
                'created_at' => $u->created_at?->diffForHumans(),
            ]);

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'total_users' => $totalUsers,
                'total_questions' => $totalQuestions,
                'sessions_today' => $sessionsToday,
                'completion_rate' => $completionRate,
            ],
            'recent_users' => $recentUsers,
        ]);
    }
}
