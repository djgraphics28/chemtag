<?php

use App\Models\GameRoom;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Battle room presence channel: only players who joined the room may subscribe.
Broadcast::channel('battle.{code}', function ($user, string $code) {
    $room = GameRoom::where('code', $code)->first();

    if (! $room || ! $room->players()->where('user_id', $user->id)->exists()) {
        return false;
    }

    return [
        'id' => $user->id,
        'name' => $user->name,
        'username' => $user->username,
        'avatar_path' => $user->avatar_path,
    ];
});
