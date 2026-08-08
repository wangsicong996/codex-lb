# Database

SQLite is the default database backend and needs no configuration. PostgreSQL is optional via `CODEX_LB_DATABASE_URL` (for example `postgresql+asyncpg://codex_lb:codex_lb@127.0.0.1:5432/codex_lb`).

## Data paths

| Environment | Path |
|-------------|------|
| Local / uvx / bin bundle | `~/.codex-lb/` (or `CODEX_LB_DATA_DIR`) |
| Flatpak (typical) | under the app's persistent data directory (set `CODEX_LB_DATA_DIR` in the Flatpak override) |

Backup this directory to preserve your data (database, encryption key, archives).

## PostgreSQL

Point `CODEX_LB_DATABASE_URL` at a reachable PostgreSQL instance. Operators own
database provisioning and upgrades outside of codex-lb; first-party Docker
Compose helpers were removed.
