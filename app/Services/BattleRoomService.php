<?php

namespace App\Services;

use App\Events\BattlePlayerAnswered;
use App\Events\BattleRoomUpdated;
use App\Events\BattleRoundEnded;
use App\Events\BattleStarted;
use App\Models\GameRoom;
use App\Models\GameRoomAnswer;
use App\Models\GameRoomPlayer;
use App\Models\GameRoomRound;
use App\Models\Question;
use App\Models\QuestionChoice;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BattleRoomService
{
    public const COUNTDOWN_SECONDS = 4;

    public const ROUNDS_PER_BATTLE = 5;

    public function createRoom(User $host, int $gameModeId, int $levelId): GameRoom
    {
        return DB::transaction(function () use ($host, $gameModeId, $levelId): GameRoom {
            $room = GameRoom::create([
                'code' => $this->generateUniqueCode(),
                'host_id' => $host->id,
                'game_mode_id' => $gameModeId,
                'level_id' => $levelId,
                'status' => 'waiting',
                'max_players' => 30,
            ]);

            $room->players()->create([
                'user_id' => $host->id,
                'joined_at' => now(),
            ]);

            return $room;
        });
    }

    public function join(GameRoom $room, User $user): void
    {
        abort_if($room->status !== 'waiting', 422, 'This battle has already started.');
        abort_if(
            $room->players()->count() >= $room->max_players,
            422,
            'This room is full.'
        );

        $room->players()->firstOrCreate(
            ['user_id' => $user->id],
            ['joined_at' => now()],
        );

        $this->broadcastRoomState($room);
    }

    public function leave(GameRoom $room, User $user): void
    {
        $room->players()->where('user_id', $user->id)->delete();

        $remaining = $room->players()->orderBy('joined_at')->first();

        if (! $remaining) {
            $room->delete();

            return;
        }

        // Promote the longest-waiting player if the host left mid-wait
        if ($room->host_id === $user->id) {
            $room->update(['host_id' => $remaining->user_id]);
        }

        $this->broadcastRoomState($room);
    }

    public function toggleReady(GameRoom $room, User $user): void
    {
        abort_if($room->status !== 'waiting', 422, 'The battle has already started.');

        $player = $room->players()->where('user_id', $user->id)->firstOrFail();
        $player->update(['is_ready' => ! $player->is_ready]);

        $this->broadcastRoomState($room);
    }

    public function start(GameRoom $room, User $user): void
    {
        abort_if($room->host_id !== $user->id, 403, 'Only the host can start the battle.');
        abort_if($room->status !== 'waiting', 422, 'The battle has already started.');
        abort_if($room->players()->count() < 2, 422, 'You need at least 2 players to battle.');
        abort_if(
            $room->players()->where('user_id', '!=', $room->host_id)->where('is_ready', false)->exists(),
            422,
            'All players must be ready.'
        );

        $questions = Question::where('game_mode_id', $room->game_mode_id)
            ->where('level_id', $room->level_id)
            ->where('is_active', true)
            ->inRandomOrder()
            ->limit(self::ROUNDS_PER_BATTLE)
            ->get();

        abort_if($questions->count() < 2, 422, 'Not enough questions available for this mode and level.');

        DB::transaction(function () use ($room, $questions): void {
            $firstStartsAt = now()->addSeconds(self::COUNTDOWN_SECONDS);

            foreach ($questions->values() as $index => $question) {
                $room->rounds()->create([
                    'question_id' => $question->id,
                    'round_number' => $index + 1,
                    // Only round 1 is scheduled now; later rounds get their
                    // window when the previous round is finalized.
                    'started_at' => $index === 0 ? $firstStartsAt : null,
                    'ends_at' => $index === 0 ? $firstStartsAt->copy()->addSeconds($question->time_limit_seconds) : null,
                ]);
            }

            $room->update(['status' => 'in_progress']);
        });

        broadcast(new BattleStarted(
            $room->code,
            $questions->count(),
            now()->addSeconds(self::COUNTDOWN_SECONDS)->toIso8601String(),
        ));
    }

    /**
     * The active (scheduled, not yet completed) round, if any.
     */
    public function currentRound(GameRoom $room): ?GameRoomRound
    {
        return $room->rounds()
            ->whereNotNull('started_at')
            ->whereNull('completed_at')
            ->orderBy('round_number')
            ->first();
    }

    /**
     * Client-facing payload for a round. Never includes is_correct.
     *
     * @return array<string, mixed>
     */
    public function roundPayload(GameRoomRound $round, User $user): array
    {
        $round->load(['question.choices' => fn ($q) => $q->orderBy('sort_order')]);
        $question = $round->question;

        $hasAnswered = $round->answers()->where('user_id', $user->id)->exists();

        return [
            'round_number' => $round->round_number,
            'total_rounds' => $round->gameRoom->rounds()->count(),
            'starts_at' => $round->started_at?->toIso8601String(),
            'ends_at' => $round->ends_at?->toIso8601String(),
            'server_now' => now()->toIso8601String(),
            'has_answered' => $hasAnswered,
            'answered_count' => $round->answers()->count(),
            'question' => [
                'id' => $question->id,
                'prompt_text' => $question->prompt_text,
                'prompt_image_path' => $question->prompt_image_path,
                'points' => $question->points,
                'time_limit_seconds' => $question->time_limit_seconds,
            ],
            'choices' => $question->choices->map(fn (QuestionChoice $c) => [
                'id' => $c->id,
                'choice_text' => $c->choice_text,
                'choice_image_path' => $c->choice_image_path,
                'sort_order' => $c->sort_order,
            ])->values(),
        ];
    }

    /**
     * Record an answer for the active round. Scoring is server-side only.
     *
     * @return array<string, mixed>
     */
    public function submitAnswer(GameRoom $room, User $user, ?int $choiceId): array
    {
        $round = $this->currentRound($room);

        abort_if($round === null, 422, 'No active round.');
        abort_if($round->started_at?->isFuture(), 422, 'The round has not started yet.');
        abort_if(
            $round->ends_at !== null && now()->greaterThan($round->ends_at->copy()->addSeconds(1)),
            422,
            'Time is up for this round.'
        );
        abort_if(
            $round->answers()->where('user_id', $user->id)->exists(),
            422,
            'You already answered this round.'
        );

        $round->load('question.choices');
        $question = $round->question;

        $choice = null;

        if ($choiceId !== null) {
            $choice = $question->choices->firstWhere('id', $choiceId);
            abort_if($choice === null, 422, 'Choice does not belong to this question.');
        }

        $isCorrect = (bool) ($choice?->is_correct ?? false);
        $timeTakenMs = (int) max(0, $round->started_at?->diffInMilliseconds(now(), false) ?? 0);

        $pointsEarned = 0;

        if ($isCorrect) {
            $limitMs = $question->time_limit_seconds * 1000;
            $speedBonus = (int) round(max(0, $limitMs - $timeTakenMs) / 1000 * 5);
            $pointsEarned = $question->points + $speedBonus;
        }

        GameRoomAnswer::create([
            'game_room_round_id' => $round->id,
            'user_id' => $user->id,
            'selected_choice_id' => $choiceId,
            'is_correct' => $isCorrect,
            'points_earned' => $pointsEarned,
            'time_taken_ms' => $timeTakenMs,
        ]);

        if ($pointsEarned > 0) {
            $room->players()->where('user_id', $user->id)->increment('score', $pointsEarned);
        }

        $answeredCount = $round->answers()->count();
        $playerCount = $room->players()->count();

        broadcast(new BattlePlayerAnswered(
            $room->code,
            $user->id,
            $round->round_number,
            $answeredCount,
            $playerCount,
        ))->toOthers();

        if ($answeredCount >= $playerCount) {
            $this->finalizeRound($room, $round);
        }

        return [
            'is_correct' => $isCorrect,
            'points_earned' => $pointsEarned,
            'answered_count' => $answeredCount,
            'player_count' => $playerCount,
        ];
    }

    /**
     * Finalize an expired round (called by clients when the timer runs out).
     * Idempotent — only the first caller performs the transition.
     */
    public function advanceIfExpired(GameRoom $room): void
    {
        $round = $this->currentRound($room);

        if ($round === null || $round->ends_at === null || now()->lessThan($round->ends_at)) {
            return;
        }

        $this->finalizeRound($room, $round);
    }

    private function finalizeRound(GameRoom $room, GameRoomRound $round): void
    {
        // Idempotency guard: first caller wins, everyone else no-ops.
        $claimed = GameRoomRound::where('id', $round->id)
            ->whereNull('completed_at')
            ->update(['completed_at' => now()]);

        if ($claimed === 0) {
            return;
        }

        $round->refresh();
        $round->load(['question.choices', 'answers.user:id,name,username,avatar_path']);

        $correctChoiceId = (int) $round->question->choices->firstWhere('is_correct', true)?->id;

        $roundResults = $round->answers->map(fn (GameRoomAnswer $a) => [
            'user_id' => $a->user_id,
            'name' => $a->user->name,
            'is_correct' => $a->is_correct,
            'points_earned' => $a->points_earned,
            'time_taken_ms' => $a->time_taken_ms,
        ])->values()->all();

        $nextRound = $room->rounds()
            ->where('round_number', '>', $round->round_number)
            ->orderBy('round_number')
            ->first();

        $nextStartsAt = null;

        if ($nextRound) {
            $startsAt = now()->addSeconds(self::COUNTDOWN_SECONDS);
            $nextRound->load('question');
            $nextRound->update([
                'started_at' => $startsAt,
                'ends_at' => $startsAt->copy()->addSeconds($nextRound->question->time_limit_seconds),
            ]);
            $nextStartsAt = $startsAt->toIso8601String();
        } else {
            $room->update(['status' => 'finished']);
        }

        broadcast(new BattleRoundEnded(
            $room->code,
            $round->round_number,
            $correctChoiceId,
            $round->question->explanation,
            $roundResults,
            $this->scoreboard($room),
            $nextRound?->round_number,
            $nextStartsAt,
            $nextRound === null,
        ));
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function scoreboard(GameRoom $room): array
    {
        return $room->players()
            ->with('user:id,name,username,avatar_path')
            ->orderByDesc('score')
            ->get()
            ->map(fn (GameRoomPlayer $p) => [
                'user_id' => $p->user_id,
                'name' => $p->user->name,
                'username' => $p->user->username,
                'avatar_path' => $p->user->avatar_path,
                'score' => $p->score,
                'is_host' => $p->user_id === $room->host_id,
            ])->values()->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function playersPayload(GameRoom $room): array
    {
        return $room->players()
            ->with('user:id,name,username,avatar_path')
            ->orderBy('joined_at')
            ->get()
            ->map(fn (GameRoomPlayer $p) => [
                'user_id' => $p->user_id,
                'name' => $p->user->name,
                'username' => $p->user->username,
                'avatar_path' => $p->user->avatar_path,
                'score' => $p->score,
                'is_ready' => $p->is_ready,
                'is_host' => $p->user_id === $room->host_id,
            ])->values()->all();
    }

    private function broadcastRoomState(GameRoom $room): void
    {
        broadcast(new BattleRoomUpdated(
            $room->code,
            $this->playersPayload($room),
            $room->status,
        ));
    }

    private function generateUniqueCode(): string
    {
        do {
            $code = strtoupper(Str::random(6));
        } while (GameRoom::where('code', $code)->exists());

        return $code;
    }
}
