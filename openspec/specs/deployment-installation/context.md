# Deployment & Installation Context

## Purpose and Scope

This capability owns the vendored `bin/` install contract (Flatpak-oriented
packaging without system site-packages) and the operator environment-variable
contract at settings-load time: which `CODEX_LB_*` values exist, which are
deliberately fixed, and how removed settings are retired.

See `openspec/specs/deployment-installation/spec.md` for normative
requirements.

## Bin bundle layout

```text
bin/
  vendor/        # uv pip install --target: app + runtime deps
  codex-lb       # PYTHONPATH launcher -> app.cli
  codex-lb-db    # PYTHONPATH launcher -> app.db.migrate
```

`make package-bin` builds frontend assets, vendors dependencies into
`bin/vendor`, writes the launchers, and archives `bin/` as
`dist/codex-lb-<version>-bin.tar.gz`. External Flatpak manifests unpack that
archive; this repository does not ship a Flatpak `.yml`/`.json` manifest.

## Why not system site-packages

Flatpak runtimes and host distros vary. Shipping project deps inside
`bin/vendor` keeps the application relocatable and avoids colliding with
system Python packages.

## Failure Modes

- Missing frontend build leaves `app/static` incomplete inside the vendor tree.
- Installing with the wrong Python major/minor breaks native wheels under
  `bin/vendor`; packaging pins Python 3.13 to match `requires-python`.
- Launchers that omit `PYTHONPATH` will import from the wrong environment.

## Related

- `release-management` — publishing the bin tarball with PyPI artifacts
- `deployment-networking` — operator-owned network exposure after Docker/Helm removal
