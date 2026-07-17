<?php

/**
 * Evaluate config/broadcasting.php's default connection under a given
 * environment, restoring the real env afterwards. Laravel's Env repository
 * is immutable, so the underlying superglobals are swapped directly.
 * Originals are captured via getenv() — PHPUnit's <env> values are not
 * present in $_SERVER.
 */
function broadcastingDefaultFor(string $appEnv, ?string $connection = null): ?string
{
    $original = [
        'APP_ENV' => getenv('APP_ENV') === false ? null : getenv('APP_ENV'),
        'BROADCAST_CONNECTION' => getenv('BROADCAST_CONNECTION') === false ? null : getenv('BROADCAST_CONNECTION'),
    ];

    $apply = function (string $key, ?string $value): void {
        if ($value === null) {
            putenv($key);
            unset($_ENV[$key], $_SERVER[$key]);
        } else {
            putenv("{$key}={$value}");
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }
    };

    try {
        $apply('APP_ENV', $appEnv);
        $apply('BROADCAST_CONNECTION', $connection);

        $config = require base_path('config/broadcasting.php');

        return $config['default'];
    } finally {
        $apply('APP_ENV', $original['APP_ENV']);
        $apply('BROADCAST_CONNECTION', $original['BROADCAST_CONNECTION']);
    }
}

it('defaults broadcasting to pusher in production', function (): void {
    expect(broadcastingDefaultFor('production'))->toBe('pusher');
});

it('defaults broadcasting to reverb outside production', function (string $env): void {
    expect(broadcastingDefaultFor($env))->toBe('reverb');
})->with(['local', 'staging', 'testing']);

it('honours an explicit BROADCAST_CONNECTION over the environment default', function (): void {
    expect(broadcastingDefaultFor('production', 'reverb'))->toBe('reverb')
        ->and(broadcastingDefaultFor('local', 'pusher'))->toBe('pusher');
});

it('has a pusher connection configured', function (): void {
    expect(config('broadcasting.connections.pusher.driver'))->toBe('pusher');
});
