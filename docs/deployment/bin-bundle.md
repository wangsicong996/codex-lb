# Bin bundle / Flatpak

codex-lb ships a vendored `bin/` archive for relocatable installs (including
external Flatpak manifests). Dependencies live under `bin/vendor` and do **not**
use system site-packages. This repository does not maintain a Flatpak `.yml`
manifest.

Normative requirements:
[`openspec/specs/deployment-installation/spec.md`](https://github.com/Soju06/codex-lb/blob/main/openspec/specs/deployment-installation/spec.md).

## Quick unpack

Download `codex-lb-<version>-bin.tar.gz` from the CI run’s **bin-bundle**
Actions artifact, then:

```bash
tar -xzf codex-lb-<version>-bin.tar.gz
./bin/codex-lb
```

Requires a Python 3.13 interpreter on `PATH` (Flatpak runtime or host).

## Build locally

```bash
make package-bin
# produces bin/ and dist/codex-lb-<version>-bin.tar.gz
PYTHONPATH=bin/vendor python3 -c "import app; import app.main"
./bin/codex-lb --help
```

## uvx (host)

```bash
uvx codex-lb
```

Network exposure, DNS, and reverse proxies are operator-owned for host and
Flatpak installs — see
[`deployment-networking`](https://github.com/Soju06/codex-lb/blob/main/openspec/specs/deployment-networking/spec.md).
