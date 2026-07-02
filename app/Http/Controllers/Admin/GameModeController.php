<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GameMode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GameModeController extends Controller
{
    public function index(): Response
    {
        $modes = GameMode::withCount('questions')->get()->map(fn (GameMode $m) => [
            'id' => $m->id,
            'code' => $m->code,
            'title' => $m->title,
            'description' => $m->description,
            'icon' => $m->icon,
            'is_active' => $m->is_active,
            'questions_count' => $m->questions_count,
        ]);

        return Inertia::render('admin/game-modes/index', [
            'modes' => $modes,
        ]);
    }

    public function update(Request $request, GameMode $gameMode): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'icon' => ['nullable', 'string', 'max:10'],
            'is_active' => ['boolean'],
        ]);

        $gameMode->update($data);

        return redirect()->route('admin.game-modes.index')->with('success', 'Game mode updated.');
    }
}
