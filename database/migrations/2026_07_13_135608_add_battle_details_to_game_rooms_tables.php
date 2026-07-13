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
        Schema::table('game_rooms', function (Blueprint $table) {
            $table->string('name', 40)->nullable()->after('code');
            $table->string('color', 20)->default('purple')->after('name');
            $table->enum('battle_type', ['single', 'team'])->default('single')->after('color');
        });

        Schema::table('game_room_players', function (Blueprint $table) {
            $table->enum('team', ['red', 'blue'])->nullable()->after('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('game_rooms', function (Blueprint $table) {
            $table->dropColumn(['name', 'color', 'battle_type']);
        });

        Schema::table('game_room_players', function (Blueprint $table) {
            $table->dropColumn('team');
        });
    }
};
