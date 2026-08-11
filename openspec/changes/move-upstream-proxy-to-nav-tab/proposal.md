# Move upstream proxy admin to a dedicated nav tab

## Why

Operators manage OpenWrt/upstream proxy pools frequently. Burying that UI under
Settings → Advanced adds friction. The fork wants a first-class **Proxy** tab
immediately to the right of Settings.

## What Changes

- Add core nav item `Proxy` → `/proxy` (to the right of Settings).
- Move the upstream proxy administration UI (enable routing, default pool,
  endpoints/pools CRUD/test) from Settings Advanced onto the Proxy page.
- Stop mounting Upstream Proxy inside Settings Advanced; stop requiring
  Settings-page-level upstream-proxy fetches solely for that section.
- Raise the `core_nav` simplicity budget from 5 to 6 for this explicit core tab.
- Keep per-account proxy bindings on the Accounts page.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `frontend-architecture`

## Impact

Dashboard navigation width increases by one core item. Settings Advanced no
longer lists upstream proxy. Account binding UX unchanged.
