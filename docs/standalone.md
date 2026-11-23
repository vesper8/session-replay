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
