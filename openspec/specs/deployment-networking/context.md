# Deployment Networking Context

## Purpose and Scope

First-party Docker and Helm networking contracts were removed. Operators run
codex-lb via `uvx`, a vendored `bin/` bundle, or an external Flatpak that
consumes the release tarball. DNS, bind addresses, TLS termination, and
reverse proxies are therefore host- or Flatpak-runtime concerns.

See `spec.md` for the normative contract.

## Decision Rationale

Container networking defaults (user-defined bridges, NetworkPolicy overlays,
ingress annotations) belonged to the deleted Docker/Helm paths. Keeping
orphaned chart requirements after deleting the chart would leave specs that
cannot be tested. Application-level DNS/network recovery for upstream calls
remains covered by proxy transport specs, not this capability.

## Constraints

- This repository does not publish container images or Helm charts.
- Flatpak sandbox permissions (network share, portals) are owned by the
  external Flatpak manifest, not by codex-lb.

## Example

```bash
# Host / uvx
uvx codex-lb --host 127.0.0.1 --port 2455

# Vendored bin bundle (Flatpak or manual unpack)
tar -xzf codex-lb-1.23.0-bin.tar.gz
./bin/codex-lb --host 127.0.0.1 --port 2455
```

## Related

- `deployment-installation` — bin-bundle layout and packaging requirements
- `runtime-portability` — CLI portability across host runtimes
