# Design

## Stale HTTP-proxy reconnect

Dashboard-routed HTTP/HTTPS proxies use `CodexClient` with
`session.request(..., proxy=...)`. When a pooled keep-alive tunnel is half-
closed by OpenWrt/NAT/the proxy listener, aiohttp raises
`ServerDisconnectedError` or a non-connector `ClientOSError` before returning a
response. A single immediate retry on the same endpoint is safe enough for this
class of failure because the first attempt never produced response headers; the
second attempt opens a fresh connection from the connector pool.

Scope limits:

- Apply only on the HTTP/HTTPS proxy request path (SOCKS already builds a fresh
  connector per attempt).
- Do not rotate the process-wide shared HTTP client; Codex sessions are usually
  short-lived and the failure is endpoint-tunnel scoped.
- Do not classify bare `ClientOSError` as cross-account pre-dispatch evidence.
  Only `ServerDisconnectedError` joins the existing
  `is_pre_dispatch_connection_failure` set so same-pool POST fallback can still
  run after the reconnect attempt fails.

## Delete semantics

- `DELETE /api/settings/upstream-proxy/endpoints/{id}` removes the endpoint and
  cascaded pool memberships.
- `DELETE /api/settings/upstream-proxy/pools/{id}` removes the pool when no
  `AccountProxyBinding` rows reference it. Bindings keep `ON DELETE RESTRICT`,
  so the API returns a dashboard validation error listing that the pool is in
  use. Default pool FK already uses `ON DELETE SET NULL`.
- Both deletes invalidate the upstream route cache before returning.

## Non-goals

- Endpoint/pool edit (rename, rotate password, reorder members).
- Persistent endpoint health scoring or automatic membership removal.
- Changing the shared outbound connector keepalive defaults.
