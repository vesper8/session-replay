<?php

namespace Packstub\SessionReplay\Http\Middleware;

use Closure;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Packstub\SessionReplay\Support\RecordingManagement;
use Symfony\Component\HttpFoundation\Response;

final class ProtectErasedRecordings
{
    public function handle(Request $request, Closure $next): Response
    {
        $id = $request->input('session');
        $id = is_string($id) && Str::isUuid($id) ? strtolower($id) : null;
        $write = function () use ($request, $next, $id) {
            if ($id && RecordingManagement::database()->table('replay_erased_ids')->where('digest', hash('sha256', $id))->exists()) {
                return response()->json(['ok' => false, 'stop' => true], 410);
            }
            $meta = $request->input('meta');
            $meta = is_string($meta) && strlen($meta) <= 1_000_000 ? json_decode($meta, true) : null;
            $assets = ! $request->routeIs('session-replay.ingest', 'session-replay.previous*.ingest') || ! empty($meta['assets']) || ! empty($meta['snapshots']);
            return $assets ? RecordingManagement::locked('assets', fn () => $next($request)) : $next($request);
        };
        try {
            return $id ? RecordingManagement::locked($id, $write) : $write();
        } catch (LockTimeoutException) {
            return response()->json(['ok' => false], 503, ['Retry-After' => '2']);
        }
    }
}
