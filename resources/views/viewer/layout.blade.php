<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>@yield('title', __('session-replay::viewer.title')) · {{ config('app.name') }}</title>
    {{-- The page's CSP nonce when the app uses one (Vite::useCspNonce()), so a style-src that names it lets this sheet through. --}}
    <style{!! ($nonce = \Illuminate\Support\Facades\Vite::cspNonce()) ? ' nonce="'.e($nonce).'"' : '' !!}>
        :root { color-scheme: light dark; --bg: #f8fafc; --card: #fff; --text: #0f172a; --muted: #64748b; --border: #e2e8f0; --accent: #4f46e5; --danger: #dc2626; --warn: #d97706; --ok: #059669; }
        @media (prefers-color-scheme: dark) { :root { --bg: #0b1120; --card: #111827; --text: #e5e7eb; --muted: #94a3b8; --border: #1f2937; --accent: #818cf8; } }
        * { box-sizing: border-box; }
        body { margin: 0; background: var(--bg); color: var(--text); font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
        .wrap { max-width: 84rem; margin: 0 auto; padding: 1.5rem 1rem 3rem; }
    </style>
    @include('session-replay::viewer.partials.styles')
    @stack('head')
</head>
<body data-replay-block>
    <div class="wrap sr-viewer">
        @yield('content')
    </div>
</body>
</html>
