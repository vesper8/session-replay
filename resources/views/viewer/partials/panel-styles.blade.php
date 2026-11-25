@include('session-replay::viewer.partials.styles')
<style @if ($nonce = \Illuminate\Support\Facades\Vite::cspNonce()) nonce="{{ $nonce }}" @endif>
    .sr-viewer--panel {
        color-scheme: light;
        --card: light-dark(white, var(--gray-900));
        --text: light-dark(var(--gray-950), white);
        --muted: light-dark(var(--gray-600), var(--gray-400));
        --border: light-dark(var(--gray-200), var(--gray-700));
        --accent: light-dark(var(--primary-700), var(--primary-400));
        --danger: light-dark(var(--danger-700), var(--danger-400));
        --warn: light-dark(var(--warning-700), var(--warning-400));
        --ok: light-dark(var(--success-700), var(--success-400));
        color: var(--text);
        padding-block: 2rem;
        min-width: 0;
        font-size: .875rem;
        container-type: inline-size;

        header.top { flex-wrap: wrap; align-items: center; }
        header.top h1 { font-size: clamp(1.5rem, 2.2vw, 1.875rem); font-weight: 700; line-height: 1.25; letter-spacing: -.025em; }
        header.top h1 .muted { font-weight: 400; font-size: .875rem; white-space: nowrap; }
        .card, .sr-markers, .sr-player__stage { background: var(--card); border-color: var(--border); border-radius: .75rem; box-shadow: 0 1px 2px rgb(0 0 0 / .05); }
        .filters { gap: .75rem 1rem; padding: 1rem; }
        .filters label { font-weight: 500; color: var(--text); }
        .filters .check { padding: .45rem 0; }
        .filters input:is([type=text], [type=date]) { min-height: 2.25rem; font-size: .875rem; }
        input[type=checkbox] { accent-color: var(--primary-600); }
        div.filters { align-items: center; justify-content: space-between; }
        div.filters > form { display: flex; align-items: center; flex-wrap: wrap; gap: .75rem; }
        :where(.filters, #erase-replays) button, a.button { font-weight: 600; }
        button.primary, a.button.primary { background: var(--primary-700); border-color: var(--primary-700); color: white; }
        button:disabled { opacity: .5; cursor: default; }
        #erase-trigger { color: var(--danger); }
        & > #erase-replays { margin-bottom: 1rem; }
        th { background: light-dark(var(--gray-50), var(--gray-800)); }
        .sr-erase-dialog { margin: auto; max-width: min(28rem, 90vw); padding: 1.5rem; color: var(--text); background: var(--card); border: 1px solid var(--border); border-radius: .75rem; }
        .sr-erase-dialog::backdrop { background: rgb(0 0 0 / .5); }
        .sr-erase-dialog h2 { font-size: 1.125rem; font-weight: 600; }
        .sr-erase-dialog p { margin-block: .75rem 1rem; }
        .sr-erase-dialog button[type=submit] { background: var(--danger-700); color: white; }
        .sr-player { --sr-pointer: var(--accent); --sr-muted: var(--muted); --sr-border: var(--border); }
        .rr-controller { color-scheme: light; color: var(--gray-950); }
    }
    .dark .sr-viewer--panel { color-scheme: dark; }
    @container (max-width: 52rem) {
        .sr-viewer--panel .sr-player { grid-template-columns: minmax(0, 1fr); }
    }
</style>
