<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Level;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LevelController extends Controller
{
    public function index(): Response
    {
        $levels = Level::withCount('questions')
            ->orderBy('order')
            ->get()
            ->map(fn (Level $l) => [
                'id' => $l->id,
                'name' => $l->name,
                'order' => $l->order,
                'difficulty' => $l->difficulty,
                'unlock_score_threshold' => $l->unlock_score_threshold,
                'questions_count' => $l->questions_count,
            ]);

        return Inertia::render('admin/levels/index', [
            'levels' => $levels,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'order' => ['required', 'integer', 'min:1'],
            'difficulty' => ['required', 'in:easy,medium,hard,expert'],
            'unlock_score_threshold' => ['required', 'integer', 'min:0'],
        ]);

        Level::create($data);

        return redirect()->route('admin.levels.index')->with('success', 'Level created.');
    }

    public function update(Request $request, Level $level): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'order' => ['required', 'integer', 'min:1'],
            'difficulty' => ['required', 'in:easy,medium,hard,expert'],
            'unlock_score_threshold' => ['required', 'integer', 'min:0'],
        ]);

        $level->update($data);

        return redirect()->route('admin.levels.index')->with('success', 'Level updated.');
    }

    public function destroy(Level $level): RedirectResponse
    {
        abort_if($level->questions()->exists(), 422, 'Cannot delete a level that has questions.');
        $level->delete();

        return redirect()->route('admin.levels.index')->with('success', 'Level deleted.');
    }
}
