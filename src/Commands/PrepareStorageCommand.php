<?php

namespace Packstub\SessionReplay\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class PrepareStorageCommand extends Command
{
    protected $signature = 'session-replay:prepare-storage {--expect-path=} {--expect-database=}';

    protected $description = 'Apply only replay migrations after verifying the exact application path and local MySQL database';

    public function handle(): int
    {
        $expectedPath = $this->option('expect-path');
        $expectedDatabase = $this->option('expect-database');
        if (!is_string($expectedPath) || realpath($expectedPath) !== realpath(base_path()) || !is_string($expectedDatabase) || $expectedDatabase === '') {
            throw new RuntimeException('Explicit matching application path and database are required.');
        }
        $name = config('session-replay.storage.connection');
        $connection = DB::connection($name);
        if ($connection->getDriverName() !== 'mysql' || !in_array($connection->getConfig('host'), ['127.0.0.1', 'localhost', '::1'], true)) {
            throw new RuntimeException('Replay setup requires an explicit local MySQL connection.');
        }
        $assert = function () use ($connection, $expectedDatabase): void {
            if ($connection->getDatabaseName() !== $expectedDatabase || $connection->getPdo()->query('select database()')->fetchColumn() !== $expectedDatabase) {
                throw new RuntimeException('The active replay database does not match the requested target.');
            }
        };
        $assert();
        $connection->beforeExecuting(function ($query) use ($assert): void {
            if (preg_match('/^\s*use\s/i', $query)) throw new RuntimeException('Database switching is forbidden during replay setup.');
            $assert();
        });
        $this->components->info('Replay storage target: '.$expectedDatabase.' in '.base_path());

        return $this->call('migrate', [
            '--database' => $name,
            '--path' => realpath(__DIR__.'/../../database/migrations'),
            '--realpath' => true,
            '--force' => true,
        ]);
    }
}
