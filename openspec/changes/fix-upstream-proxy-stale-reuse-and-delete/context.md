# Context

Operators managing OpenWrt/local upstream proxies hit two gaps: half-closed
HTTP proxy tunnels fail without a same-endpoint reconnect, and the dashboard
could create endpoints/pools but never delete them. This change adds one
reconnect attempt for stale keep-alive disconnects, treats
`ServerDisconnectedError` as pre-dispatch for same-pool fallback, and exposes
DELETE APIs + Settings UI delete actions.

## Example

1. Pool member `http://192.168.1.1:8118` works, then an idle keep-alive dies.
2. Next POST raises `ServerDisconnectedError`; CodexClient retries once on the
   same endpoint and succeeds without switching accounts.
3. Operator deletes a dead SOCKS endpoint from Settings instead of stacking
   duplicates; pool delete remains blocked while an account binding exists.
