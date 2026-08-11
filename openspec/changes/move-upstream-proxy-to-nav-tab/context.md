# Context

## Purpose

Move upstream proxy pool/endpoint administration out of Settings → Advanced into
a first-class core-nav **Proxy** tab (`/proxy`), immediately to the right of
Settings.

## Decisions

- Raise `core_nav.max_items` from 5 → 6 (explicit exception in this change).
- Keep per-account proxy bindings on Accounts (they are account-scoped, not pool
  admin).
- Keep routing concurrency caps (`proxyAccount*`) on Settings → Advanced →
  Routing (those are balancer limits, not upstream egress proxies).
- Reuse existing `UpstreamProxySettings` component; only the host page changes.

## Example

Operator opens Dashboard → clicks **代理** / **Proxy** → enables routing,
creates an OpenWrt SOCKS endpoint, creates a pool, sets default pool — without
opening Settings Advanced.
