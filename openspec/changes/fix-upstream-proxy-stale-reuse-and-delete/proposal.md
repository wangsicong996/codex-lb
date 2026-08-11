# Fix stale upstream-proxy reuse and allow delete

## Why

Operators see dashboard HTTP/SOCKS upstream proxies fail after idle use with
transport errors such as `ClientOSError` / `ServerDisconnectedError` /
`ReadError`. Re-adding an endpoint appears to "fix" the problem because there
is no delete path and the pool keeps preferring the first member. Stale
keep-alive reuse on the Codex HTTP proxy path also fails once without a same-
endpoint reconnect, so a half-closed proxy tunnel becomes a hard failure.

## What Changes

- Retry a Codex HTTP-proxy request once on the same endpoint when the first
  attempt fails with a stale keep-alive / half-closed transport error before a
  response is returned.
- Treat `ServerDisconnectedError` as pre-dispatch connection failure so
  same-pool fallback can continue after the reconnect attempt fails.
- Add dashboard + API delete for proxy endpoints and pools (reject pool delete
  while account bindings still reference the pool; clear default pool via
  existing `ON DELETE SET NULL`).
- Invalidate the upstream route cache after delete mutations.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `outbound-http-clients`
- `upstream-proxy-routing`
- `frontend-architecture`

## Impact

Settings upstream-proxy admin API gains `DELETE` routes. Dashboard Settings
upstream proxy section gains delete controls with confirmation. No schema
migration; FK behavior already cascades memberships and nulls the default pool.
