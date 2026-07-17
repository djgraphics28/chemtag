<?php

use App\Models\GameRoom;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Battle room presence channel: players in the room may subscribe;
// admins may too, so they can observe and chat without being listed.
Broadcast::channel('battle.{code}', function ($user, string $code) {
    $room = GameRoom::where('code', $code)->first();

    if (! $room) {
        return false;
    }

    if (! $room->players()->where('user_id', $user->id)->exists() && ! $user->hasRole('admin')) {
        return false;
    }

    return [
        'id' => $user->id,
        'name' => $user->name,
        'username' => $user->username,
        'avatar_path' => $user->avatar_path,
    ];
});
