<?php

namespace Packstub\SessionReplay\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RecorderCors
{
    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->header('Origin');

        if ($origin === null || $origin === $request->getSchemeAndHttpHost()) {
            return $next($request);
        }

        abort_unless(in_array($origin, (array) config('session-replay.ingest.origins', []), true), 403);

        if ($request->isMethod('OPTIONS')) {
            abort_unless(strtoupper((string) $request->header('Access-Control-Request-Method')) === 'POST', 405);
        }

        $response = $request->isMethod('OPTIONS') ? response()->noContent() : $next($request);
        $response->headers->set('Access-Control-Allow-Origin', $origin);
        $response->setVary('Origin', false);
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type');

        return $response;
    }
}
