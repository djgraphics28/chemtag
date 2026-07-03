<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('levels', 'topics');

        Schema::table('topics', function (Blueprint $table) {
            $table->unsignedSmallInteger('questions_per_game')->default(10)->after('order');
            $table->dropColumn(['difficulty', 'unlock_score_threshold']);
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->renameColumn('level_id', 'topic_id');
        });

        Schema::table('game_sessions', function (Blueprint $table) {
            $table->renameColumn('level_id', 'topic_id');
        });

        Schema::table('game_rooms', function (Blueprint $table) {
            $table->renameColumn('level_id', 'topic_id');
        });
    }

    public function down(): void
    {
        Schema::table('game_rooms', function (Blueprint $table) {
            $table->renameColumn('topic_id', 'level_id');
        });

        Schema::table('game_sessions', function (Blueprint $table) {
            $table->renameColumn('topic_id', 'level_id');
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->renameColumn('topic_id', 'level_id');
        });

        Schema::table('topics', function (Blueprint $table) {
            $table->dropColumn('questions_per_game');
            $table->enum('difficulty', ['easy', 'medium', 'hard'])->default('easy');
            $table->unsignedInteger('unlock_score_threshold')->default(0);
        });

        Schema::rename('topics', 'levels');
    }
};
