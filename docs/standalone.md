# Standalone frontend integration (Spicy fork)

This fork builds on [Packstub Session Replay 1.2.0](https://github.com/packstub/session-replay/releases/tag/v1.2.0)
and the scope described in [upstream issue 54](https://github.com/packstub/session-replay/issues/54).
The event, chunk, asset and signed-token formats stay compatible with upstream.

## Backend

An application-owned authenticated endpoint calls `SessionReplay::recorderConfiguration()`
after its authentication, tenant initialization and access checks. It returns a nullable
configuration array: null means recording is disabled for this request. Return it with
`Cache-Control: private, no-store`. Never cache one user's configuration for another.

The same `recordWhen`, `userUsing`, `tenantUsing`, `impersonatorUsing` and privacy settings
apply as with the Blade directive. The endpoint must be outside the package's own route
prefix, which the recorder excludes. The application handles CORS and authentication for
this endpoint; it is deliberately not a public token issuer.

`scriptUrl` names the bundled recorder. Configure `ingest.origins` with exact frontend
origins to allow cross-origin multipart POSTs to ingest, assets and snapshots. The package
answers their OPTIONS requests and never enables credentialed CORS. Upload identity still
comes from the signed token and the recording's write key; browser-supplied user or tenant
ids are never trusted.

`capture.request_origins` adds exact API origins to failed fetch/XHR capture. Bodies and
headers are not recorded. `X-Session-Replay` carries `<recording UUID>.<write key>` on the
application's own API requests, and AddReplayContext accepts it ahead of the cookie. Include
it only for the current tenant's trusted API origin, never third-party requests. The write
key is required for server-error attribution; a UUID by itself is not an upload credential.

## Browser

Set `window.__sessionReplay = { ...configuration, deferStart: true }` before loading
`configuration.scriptUrl` as a classic script. Loading installs `window.SessionReplay`
without starting capture; the SPA then calls `SessionReplay.configure(configuration)` only
if the user and tenant that requested it are still current.

- `configure(configuration)` discards the old local buffer and session, adopts the new signed
  context and starts a fresh recording. It never flushes an old rolling buffer on a switch.
- `reset()` stops recording, drops the buffer and clears this tab's saved session. Call it
  synchronously before changing tenant, signing out or entering an excluded route.
- `contextHeader()` returns this active recording's UUID and write key, or null.
- `send()` uploads the rolling buffer and continues recording, as upstream documents.

Staff-operated installations can use `mode=session` and `consent=always` without rendering
customer replay controls. The application's authenticated configuration endpoint remains
authoritative; poll it and call `reset()` when capture is disabled or its policy cannot be
retrieved. Ingest also rejects uploads when the server flag is off. Spicy uses the stricter
[`privacy.layout_only` profile](privacy.md#reduced-layout-capture-spicy-fork), removes stored
person identity and raw user agents, and disables free-form capture channels.

Initialize the bundle once per document. Capture watcher settings are installed with the
first configuration; reload the document after changing those settings. Context switches
change identity and token while retaining the same installation's capture policy.

This first slice uses the existing served bundle rather than publishing an npm recorder.
Assist remains outside this standalone integration. See [Recording](recording.md),
[Privacy](privacy.md), [Storage](storage.md) and [Configuration](configuration.md) for the
unchanged upstream features.

## Verification status

PHP and JavaScript syntax, route registration and asset builds are checked. No tests have
been created or run: the enclosing Spicy repository explicitly requires a separate request
for tests. Authenticated recording, cross-origin uploads, identity changes and playback
still need runtime verification before enabling capture.

## Shared SPA client and application adapters

The served ES module `/session-replay/scripts/client.js` exports `createReplayClient({
configuration, origin, onState, refreshMs })`. `configuration(context, abortSignal)` is an
application-owned authenticated request returning `{ enabled, configuration }`. Set a context
with `{ key, scope, ...applicationCredentials }`; a changed key synchronously resets capture.
`contextHeader(scope)` only returns a browser possession proof for the current scope.
`stop()` cancels requests/timers and discards local events; `destroy()` also removes its listener.
The client refreshes policy every minute, stops on failure/disable and restarts when allowed.
A page-based host can opt into `resumeOnLoad: true` to continue the current browser tab’s recording on the first authorized configuration in a new document. The recorder checks its identity and idle timeout. Bind identity to the login session when a fresh login should split playback. For Livewire navigation, supply fresh signed settings synchronously on each eligible page so the native navigation observer can resume with a full snapshot.

The host owns authentication, authorization, context selection, storage, privacy and viewer access.
No Vue, Axios, Filament, Spicy user model or product tenancy dependency belongs in this client.

Each consumer pins this Git submodule to an explicit reviewed commit. Updating this fork
alone never advances the application's pin. A native Filament adapter can use the same core
with `SessionReplay::recorder()` in a panel render hook instead of the SPA client.

Before enabling, run `session-replay:prepare-storage --expect-path=<absolute application path>
--expect-database=<local database>` from that application. It verifies the application path,
configured and actual write database, refuses non-local/non-MySQL targets, checks the connection
before every query and applies only the package's additive migrations. It never provisions
users, tenants or another application's database. Keep `run_migrations=false` in each adapter.

## Staff management

Enable `viewer.manage` after applying the package migrations and registering the
`manageSessionReplay` gate on the viewer guard. The manager controls capture privacy for
this installation. Before the first saved setting, `privacy.anonymous` supplies the default.
In the layout profile, turning anonymization off records the authenticated subject and
ordinary visible text. Input values, explicitly private regions and raw resource addresses
remain protected. Turning it on masks text and removes attribution. Open adapters receive
changes at configuration refresh. An installation with tenant-local subjects can use
`viewer.recorded_user_label` to store a display attribute with identified recordings.

Delete a single replay from its player or select rows on a list page and confirm permanent
deletion. Chunk files and dependent rows are removed. Assets exclusively referenced by the
selection are removed and shared assets survive. Only a digest of the erased identifier
remains to refuse late uploads for that recording.
