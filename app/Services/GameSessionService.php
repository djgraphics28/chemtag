<?php

namespace App\Services;

use App\Models\GameSession;
use App\Models\GameSessionAnswer;
use App\Models\Question;
use App\Models\QuestionChoice;

class GameSessionService
{
    public function getNextQuestion(GameSession $session): ?Question
    {
        $answeredIds = $session->answers()->pluck('question_id')->all();

        // Sessions carry their own randomly drawn question order
        $nextId = collect($session->question_ids ?? [])
            ->first(fn (int $id) => ! in_array($id, $answeredIds));

        if ($nextId === null) {
            return null;
        }

        return Question::where('is_active', true)
            ->with(['choices', 'gameMode'])
            ->find($nextId);
    }

    public function getTotalQuestions(GameSession $session): int
    {
        return count($session->question_ids ?? []);
    }

    /** Score deducted each time a 4-Pics-1-Word hint letter is revealed. */
    public const HINT_COST = 25;

    /**
     * Reveal the answer letter at the given slot for the current
     * 4-Pics-1-Word question, deducting HINT_COST from the session score.
     *
     * @return array{position: int, letter: string, cost: int, score: int}
     */
    public function revealHintLetter(GameSession $session, int $position): array
    {
        $question = $this->getNextQuestion($session);
        abort_if($question === null, 422, 'No active question.');
        abort_if($question->gameMode->code !== 'pattern_clue', 422, 'Hints are only available for clue questions.');

        $answer = $question->clueAnswer();
        abort_if($answer === null || $position >= strlen($answer), 422, 'Invalid hint position.');

        $session->update(['score' => max(0, $session->score - self::HINT_COST)]);

        return [
            'position' => $position,
            'letter' => $answer[$position],
            'cost' => self::HINT_COST,
            'score' => $session->score,
        ];
    }

    /**
     * @return array{correct: bool, explanation: string|null, points_earned: int, correct_choice_id: int|null, session: array<string,mixed>, is_game_over: bool}
     */
    public function submitAnswer(
        GameSession $session,
        ?int $choiceId,
        int $timeTakenSeconds,
        ?string $word = null
    ): array {
        // Resolve the question being answered
        if ($choiceId !== null) {
            $choice = QuestionChoice::with('question')->findOrFail($choiceId);
            $question = $choice->question;

            abort_if(
                $question->game_mode_id !== $session->game_mode_id
                    || $question->topic_id !== $session->topic_id
                    || ! in_array($question->id, $session->question_ids ?? [], true),
                403,
                'Choice does not belong to this session.'
            );
        } else {
            // Word answer or timeout: resolve the current unanswered question
            $question = $this->getNextQuestion($session);
            abort_if($question === null, 422, 'No active question to answer.');
        }

        if ($session->answers()->where('question_id', $question->id)->exists()) {
            abort(422, 'Question already answered.');
        }

        $isTimeout = $choiceId === null && $word === null;
        $correctChoiceId = $question->choices()->where('is_correct', true)->value('id');

        // 4 Pics 1 Word answers arrive as a typed word instead of a choice
        if ($word !== null && $choiceId === null) {
            $isCorrect = $question->clueAnswer() !== null
                && Question::normalizeWord($word) === $question->clueAnswer();

            // Record against the correct choice so per-choice stats stay consistent
            $choiceId = $isCorrect ? $correctChoiceId : null;
        } else {
            $isCorrect = $choiceId !== null && ($choice->is_correct ?? false);
        }

        $pointsEarned = 0;

        if ($isCorrect) {
            $timeBonus = max(0, $question->time_limit_seconds - $timeTakenSeconds) * 5;
            $streakBonus = min($session->streak_count, 5) * 10;
            $pointsEarned = $question->points + $timeBonus + $streakBonus;
        }

        GameSessionAnswer::create([
            'game_session_id' => $session->id,
            'question_id' => $question->id,
            'selected_choice_id' => $choiceId,
            'is_correct' => $isCorrect,
            'time_taken_seconds' => $timeTakenSeconds,
            'points_earned' => $pointsEarned,
        ]);

        $newScore = $session->score + $pointsEarned;
        $newStreak = $isCorrect ? $session->streak_count + 1 : 0;
        $newLives = $isCorrect ? $session->lives_remaining : max(0, $session->lives_remaining - 1);
        $status = $session->status;

        if ($newLives === 0) {
            $status = 'failed';
        }

        $session->update([
            'score' => $newScore,
            'streak_count' => $newStreak,
            'lives_remaining' => $newLives,
            'status' => $status,
        ]);

        $nextQuestion = $status === 'failed' ? null : $this->getNextQuestion($session->fresh());
        $isGameOver = $status === 'failed' || $nextQuestion === null;

        if ($isGameOver && $status !== 'failed') {
            $session->update(['status' => 'completed', 'ended_at' => now()]);
            $xpGained = (int) round($newScore * 0.1);
            $session->user->increment('xp_total', $xpGained);
        }

        $session->refresh();

        return [
            'is_correct' => $isCorrect,
            'timed_out' => $isTimeout,
            'correct_word' => $word !== null || $isTimeout ? $question->clueAnswer() : null,
            'explanation' => $question->explanation,
            'points_earned' => $pointsEarned,
            'correct_choice_id' => $correctChoiceId,
            'choice_feedback' => $question->choices
                ->filter(fn (QuestionChoice $c) => $c->feedback_text !== null && $c->feedback_text !== '')
                ->mapWithKeys(fn (QuestionChoice $c) => [$c->id => $c->feedback_text]),
            'score' => $session->score,
            'lives_remaining' => $session->lives_remaining,
            'streak_count' => $session->streak_count,
            'session_status' => $session->status,
            'is_game_over' => $isGameOver,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function formatQuestion(Question $question, GameSession $session): array
    {
        $total = $this->getTotalQuestions($session);
        $answered = $session->answers()->count();

        // 4 Pics 1 Word: choices would leak the answer, so the client gets
        // the clue images plus a letter pool instead.
        $isCluePuzzle = $question->gameMode->code === 'pattern_clue';

        return [
            'question' => [
                'id' => $question->id,
                'game_mode_code' => $question->gameMode->code,
                'prompt_text' => $question->prompt_text,
                'prompt_image_path' => $question->promptImageUrl(),
                'prompt_smiles' => $question->prompt_smiles,
                'clue_image_urls' => $isCluePuzzle ? $question->clueImageUrls() : [],
                'word_length' => $isCluePuzzle ? strlen((string) $question->clueAnswer()) : null,
                'letters' => $isCluePuzzle ? $question->clueLetterPool() : null,
                'time_limit_seconds' => $question->time_limit_seconds,
                'points' => $question->points,
            ],
            'choices' => $isCluePuzzle ? [] : $question->choices->shuffle()->map(fn (QuestionChoice $c) => [
                'id' => $c->id,
                'choice_text' => $c->choice_text,
                'choice_image_path' => $c->choiceImageUrl(),
                'choice_smiles' => $c->choice_smiles,
            ])->values(),
            'progress' => [
                'answered' => $answered,
                'total' => $total,
                'question_number' => $answered + 1,
            ],
        ];
    }
}
