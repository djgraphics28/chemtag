<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('game_session_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('selected_choice_id')->constrained('question_choices')->cascadeOnDelete();
            $table->boolean('is_correct')->default(false);
            $table->unsignedSmallInteger('time_taken_seconds')->default(0);
            $table->unsignedInteger('points_earned')->default(0);
            $table->timestamps();

            // Prevent double-answering within a session
            $table->unique(['game_session_id', 'question_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('game_session_answers');
    }
};
