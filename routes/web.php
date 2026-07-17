<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\GameModeController as AdminGameModeController;
use App\Http\Controllers\Admin\QuestionController as AdminQuestionController;
use App\Http\Controllers\Admin\RoleController as AdminRoleController;
use App\Http\Controllers\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Admin\TopicController as AdminTopicController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\AnswerController;
use App\Http\Controllers\BattleController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\PlayerController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::prefix('game')->name('game.')->middleware('games.unlocked')->group(function () {
        Route::get('topics', [GameController::class, 'topics'])->name('topics');
        Route::post('sessions', [GameController::class, 'startSession'])->name('sessions.store');
        Route::get('sessions/{session}/play', [GameController::class, 'play'])->name('sessions.show');
        Route::get('sessions/{session}/question', [GameController::class, 'currentQuestion'])->name('sessions.question');
        Route::post('sessions/{session}/answers', [AnswerController::class, 'store'])->name('sessions.answers.store');
        Route::get('sessions/{session}/results', [GameController::class, 'results'])->name('sessions.results');
        Route::get('leaderboard', [GameController::class, 'leaderboard'])->name('leaderboard');
    });

    Route::get('players/{user:username}', [PlayerController::class, 'show'])->name('players.show');
    Route::get('players/{user:username}/summary', [PlayerController::class, 'summary'])->name('players.summary');

    Route::prefix('battle')->name('battle.')->middleware('games.unlocked')->group(function () {
        Route::get('/', [BattleController::class, 'lobby'])->name('lobby');
        Route::post('rooms', [BattleController::class, 'store'])->name('rooms.store');
        Route::post('join', [BattleController::class, 'join'])->name('join');
        Route::get('rooms/{room:code}', [BattleController::class, 'show'])->name('rooms.show');
        Route::post('rooms/{room:code}/ready', [BattleController::class, 'ready'])->name('rooms.ready');
        Route::post('rooms/{room:code}/team', [BattleController::class, 'team'])->name('rooms.team');
        Route::post('rooms/{room:code}/leave', [BattleController::class, 'leave'])->name('rooms.leave');
        Route::post('rooms/{room:code}/kick', [BattleController::class, 'kick'])->name('rooms.kick');
        Route::get('rooms/{room:code}/chat', [BattleController::class, 'chatIndex'])->name('rooms.chat.index');
        Route::post('rooms/{room:code}/chat', [BattleController::class, 'chatStore'])
            ->middleware('throttle:60,1')
            ->name('rooms.chat.store');
        Route::post('rooms/{room:code}/start', [BattleController::class, 'start'])->name('rooms.start');
        Route::get('rooms/{room:code}/round', [BattleController::class, 'round'])->name('rooms.round');
        Route::post('rooms/{room:code}/answers', [BattleController::class, 'answer'])->name('rooms.answers');
        Route::post('rooms/{room:code}/advance', [BattleController::class, 'advance'])->name('rooms.advance');
    });

    Route::prefix('admin')->name('admin.')->middleware('role:admin')->group(function () {
        Route::get('/', AdminDashboardController::class)->name('dashboard');

        Route::resource('users', AdminUserController::class)->except('show');
        Route::resource('roles', AdminRoleController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::get('questions/template', [AdminQuestionController::class, 'downloadTemplate'])->name('questions.template');
        Route::post('questions/import', [AdminQuestionController::class, 'import'])->name('questions.import');
        Route::resource('questions', AdminQuestionController::class)->except('show');
        Route::resource('game-modes', AdminGameModeController::class)->only(['index', 'update']);
        Route::resource('topics', AdminTopicController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::get('settings', [AdminSettingController::class, 'index'])->name('settings.index');
        Route::post('settings', [AdminSettingController::class, 'update'])->name('settings.update');
    });
});

require __DIR__.'/settings.php';
