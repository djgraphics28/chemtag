<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks the game and battle sections for non-admin users while the
 * admin-controlled "games_locked" setting is on.
 */
class EnsureGamesUnlocked
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Setting::gamesLocked() || $request->user()?->hasRole('admin')) {
            return $next($request);
        }

        abort_if(
            $request->expectsJson() || ! $request->isMethod('GET'),
            423,
            'Games are currently locked by the administrator.'
        );

        return Inertia::render('game/locked')->toResponse($request);
    }
}
