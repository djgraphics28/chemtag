<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Topic;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TopicController extends Controller
{
    public function index(): Response
    {
        $topics = Topic::withCount('questions')
            ->orderBy('order')
            ->get()
            ->map(fn (Topic $topic) => [
                'id' => $topic->id,
                'name' => $topic->name,
                'order' => $topic->order,
                'questions_per_game' => $topic->questions_per_game,
                'questions_count' => $topic->questions_count,
            ]);

        return Inertia::render('admin/topics/index', [
            'topics' => $topics,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'order' => ['required', 'integer', 'min:1'],
            'questions_per_game' => ['required', 'integer', 'min:2', 'max:50'],
        ]);

        Topic::create($data);

        return redirect()->route('admin.topics.index')->with('success', 'Topic created.');
    }

    public function update(Request $request, Topic $topic): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'order' => ['required', 'integer', 'min:1'],
            'questions_per_game' => ['required', 'integer', 'min:2', 'max:50'],
        ]);

        $topic->update($data);

        return redirect()->route('admin.topics.index')->with('success', 'Topic updated.');
    }

    public function destroy(Topic $topic): RedirectResponse
    {
        abort_if($topic->questions()->exists(), 422, 'Cannot delete a topic that has questions.');
        $topic->delete();

        return redirect()->route('admin.topics.index')->with('success', 'Topic deleted.');
    }
}
