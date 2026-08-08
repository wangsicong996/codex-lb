# Getting Started

codex-lb runs with zero configuration — every setting has a working default.

## Quick Start

```bash
# uvx (recommended on host)
uvx codex-lb

# or unpack a release bin bundle (Flatpak / relocatable)
tar -xzf codex-lb-<version>-bin.tar.gz
./bin/codex-lb
```

Open [localhost:2455](http://localhost:2455) → Add account → Done.

Next: point your coding agent at codex-lb — see [Client Setup](client-setup.md).

More packaging detail: [Bin bundle / Flatpak](deployment/bin-bundle.md).

## Remote setup (bootstrap token)

When accessing the dashboard remotely for the first time, a bootstrap token is required to set the initial password.

**Auto-generated (default):** On first startup (no password configured), the server generates a one-time token and prints it to logs:

```bash
# follow the process logs for the first-run token block
# ============================================
#   Dashboard bootstrap token (first-run):
#   <token>
# ============================================
```

Open the dashboard → enter the token + new password → done. The token is shared across replicas and remains valid until a password is set. Multi-replica setups must share the same encryption key for restart recovery.

**Manual token:** To use a fixed token instead, set the env var before starting:

```bash
CODEX_LB_DASHBOARD_BOOTSTRAP_TOKEN=your-secret-token uvx codex-lb
```

**Local access** (localhost) bypasses bootstrap entirely — no token needed.
