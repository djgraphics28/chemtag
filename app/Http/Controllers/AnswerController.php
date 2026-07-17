<?php

namespace App\Http\Controllers;

use App\Models\GameSession;
use App\Services\GameSessionService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnswerController extends Controller
{
    public function __construct(private readonly GameSessionService $service) {}

    public function store(Request $request, GameSession $session): JsonResponse
    {
        abort_if($session->user_id !== $request->user()->id, 403);
        abort_if($session->status !== 'in_progress', 422, 'Session is not in progress.');

        $validated = $request->validate([
            'choice_id' => ['nullable', 'integer', 'exists:question_choices,id'],
            'word' => ['nullable', 'string', 'max:60'],
            'time_taken_seconds' => ['required', 'integer', 'min:0', 'max:120'],
        ]);

        try {
            $result = $this->service->submitAnswer(
                $session,
                $validated['choice_id'] ?? null,
                $validated['time_taken_seconds'],
                $validated['word'] ?? null,
            );
        } catch (UniqueConstraintViolationException) {
            return response()->json(['message' => 'Question already answered.'], 422);
        }

        return response()->json($result);
    }
}
