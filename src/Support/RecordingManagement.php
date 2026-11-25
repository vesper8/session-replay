<?php

namespace Packstub\SessionReplay\Support;

use Closure;
use Illuminate\Database\Connection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Packstub\SessionReplay\Facades\SessionReplay;
use Packstub\SessionReplay\Models\ReplayAsset;
use Packstub\SessionReplay\Models\ReplayAssetOwner;
use Packstub\SessionReplay\Models\ReplaySession;
use Packstub\SessionReplay\Models\ReplaySessionAsset;
use RuntimeException;

final class RecordingManagement
{
    public static function database(): Connection
    {
        return DB::connection(config('session-replay.storage.connection'));
    }

    public static function allowed(): bool
    {
        return config('session-replay.viewer.manage', false)
            && Gate::forUser(SessionReplay::viewer())->allows('manageSessionReplay');
    }

    public static function anonymous(): bool
    {
        return (bool) (self::database()->table('replay_capture_settings')->where('id', 1)->value('anonymous')
            ?? config('session-replay.privacy.anonymous', true));
    }

    public static function locked(string $key, Closure $action): mixed
    {
        return Cache::lock('replay-write:'.self::database()->getDatabaseName().':'.$key, 120)->block(10, $action);
    }

    public function erase(ReplaySession $session, ReplayStorage $storage): void
    {
        self::locked($session->id, fn () => self::locked('assets', function () use ($session, $storage) {
            self::database()->transaction(function () use ($session, $storage) {
                $hashes = $session->snapshotReferences()->pluck('hash');
                self::database()->table('replay_erased_ids')->insertOrIgnore(['digest' => hash('sha256', $session->id)]);
                if (! $session->delete()) {
                    throw new RuntimeException('Could not erase recording files.');
                }

                Cache::forget('session-replay:server-errors:'.$session->id);
                $unused = ReplayAsset::query()->whereIn('hash', $hashes)
                    ->whereNotIn('hash', ReplaySessionAsset::query()->select('hash'))->get();
                foreach ($unused as $asset) {
                    if (! $storage->delete($asset->path)) {
                        throw new RuntimeException('Could not erase recording assets.');
                    }
                    ReplayAssetOwner::query()->where('hash', $asset->hash)->delete();
                    $asset->delete();
                }
            });
        }));
    }
}
