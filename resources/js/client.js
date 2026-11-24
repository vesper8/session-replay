// Framework-neutral SPA adapter. Authentication, scope and configuration transport belong to the host application.
export function createReplayClient({ configuration, origin = location.origin, onState = () => {}, refreshMs = 60_000 }) {
    let context = null;
    let revision = 0;
    let pending = null;
    let timer = null;
    let loading = null;
    let policy = null;
    const state = (phase, id = null) => onState({ phase, id, scope: context?.scope ?? null });
    const sessionChanged = (event) => { if (context) state('recording', event.detail.id); };
    window.addEventListener('session-replay:session', sessionChanged);

    function stop() {
        revision++;
        clearTimeout(timer);
        pending?.abort();
        pending = null;
        context = null;
        policy = null;
        window.SessionReplay?.reset();
        state('disabled');
    }

    function install(settings) {
        const source = new URL(settings.scriptUrl);
        if (source.origin !== origin || new URL(settings.ingestUrl).origin !== origin) throw new Error('Untrusted replay origin.');
        if (window.SessionReplay) return Promise.resolve(window.SessionReplay);
        if (loading) return loading;
        window.__sessionReplay = { ...settings, deferStart: true };
        loading = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = source.href;
            script.onload = () => window.SessionReplay ? resolve(window.SessionReplay) : reject(new Error('Recorder unavailable.'));
            script.onerror = () => { script.remove(); reject(new Error('Recorder unavailable.')); };
            document.head.appendChild(script);
        }).catch((error) => { loading = null; throw error; });
        return loading;
    }

    async function refresh(current) {
        pending = new AbortController();
        try {
            const result = await configuration(context, pending.signal);
            if (current !== revision) return;
            if (!result.enabled) {
                window.SessionReplay?.reset();
                policy = null;
                state('disabled');
                return;
            }
            const settings = result.configuration;
            const nextPolicy = JSON.stringify({ ...settings, token: undefined });
            const recorder = await install(settings);
            if (current !== revision) return;
            if (policy !== nextPolicy || !recorder.isRecording()) {
                recorder.configure(settings);
                policy = nextPolicy;
            }
            state(recorder.isRecording() ? 'recording' : 'disabled', recorder.sessionId());
        } catch {
            if (current !== revision) return;
            window.SessionReplay?.reset();
            policy = null;
            state('unavailable');
        } finally {
            if (current === revision) {
                pending = null;
                timer = setTimeout(() => refresh(current), refreshMs);
            }
        }
    }

    return {
        setContext(next) {
            if (next?.key && next.key === context?.key) { context = next; return; }
            stop();
            if (!next?.key) return;
            context = next;
            state('loading');
            refresh(revision);
        },
        stop,
        contextHeader(scope) {
            return context?.scope === scope && window.SessionReplay?.isRecording() ? window.SessionReplay.contextHeader() : null;
        },
        destroy() { stop(); window.removeEventListener('session-replay:session', sessionChanged); },
    };
}
