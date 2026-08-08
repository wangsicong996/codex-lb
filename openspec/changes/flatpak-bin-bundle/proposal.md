## Why

codex-lb is moving to Flatpak-style distribution: Python dependencies must ship
inside a vendored `bin/` tree rather than relying on system site-packages or
container images. Docker, Compose, and Helm are no longer project-owned
deployment paths, so their CI/Release/Dependabot surface and chart contracts
should be removed.

## What Changes

- Add a `bin/` vendor bundle (dependencies under `bin/vendor`, launchers, and a
  versioned `*-bin.tar.gz` artifact) for external Flatpak manifests.
- Remove Docker/Compose/Helm source trees, CI jobs, release publishing, and
  Dependabot docker ecosystems.
- Retarget release-managed version fields and beta validation evidence away
  from Helm Chart.yaml / Docker smoke toward PyPI + bin-bundle smoke.
- This repository does not maintain a Flatpak manifest.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `deployment-installation`: replace Helm/Compose install contracts with the
  vendored `bin/` bundle contract; keep operator settings-surface rules.
- `release-management`: publish PyPI + bin tarball; drop Docker/Helm artifacts
  and Chart.yaml version guards.
- `deployment-networking`: drop Docker/Helm networking requirements (network
  exposure is host/Flatpak operator-owned).

## Impact

- CI/Release workflows, release guards, Dependabot, and required-check labels.
- Docs that described Docker/Helm install paths.
- Unit tests that asserted chart/compose/docker contracts.
- Operators previously on Docker/Helm must switch to uvx, the bin tarball, or
  an external Flatpak that consumes the tarball.
