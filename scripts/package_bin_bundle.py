#!/usr/bin/env python3
"""Build a vendored bin/ bundle for Flatpak and other relocatable installs.

Creates:
  bin/vendor/       - app + runtime deps via ``uv pip install --target``
  bin/codex-lb      - launcher setting PYTHONPATH to vendor
  bin/codex-lb-db   - migration launcher
  dist/codex-lb-<version>-bin.tar.gz

Does not write to system site-packages. Expects a Python 3.13 interpreter
(matching requires-python); Flatpak/host runtimes supply that interpreter.
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import tarfile
import tomllib
from pathlib import Path


LAUNCHERS: tuple[tuple[str, str], ...] = (
    ("codex-lb", "from app.cli import main; raise SystemExit(main())"),
    ("codex-lb-db", "from app.db.migrate import main; raise SystemExit(main())"),
)

# Native wheels in bin/vendor must be imported with this ABI.
_BUNDLE_PYTHON = "3.13"


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def _read_version(root: Path) -> str:
    data = tomllib.loads((root / "pyproject.toml").read_text(encoding="utf-8"))
    project = data.get("project")
    if not isinstance(project, dict):
        raise SystemExit("pyproject.toml missing [project]")
    version = project.get("version")
    if not isinstance(version, str) or not version:
        raise SystemExit("pyproject.toml missing [project].version")
    return version


def _run(cmd: list[str], *, cwd: Path, env: dict[str, str] | None = None) -> None:
    print("+", " ".join(cmd), flush=True)
    subprocess.run(cmd, cwd=cwd, check=True, env=env)


def _write_launcher(path: Path, body: str) -> None:
    script = f"""#!/usr/bin/env python3
from __future__ import annotations

import os
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent
_VENDOR = _ROOT / "vendor"
sys.path.insert(0, str(_VENDOR))
os.environ["PYTHONPATH"] = (
    str(_VENDOR) if not os.environ.get("PYTHONPATH") else f"{{_VENDOR}}{{os.pathsep}}{{os.environ['PYTHONPATH']}}"
)

{body}
"""
    path.write_text(script, encoding="utf-8")
    path.chmod(0o755)


def build_bundle(root: Path, *, skip_frontend: bool) -> Path:
    version = _read_version(root)
    bin_dir = root / "bin"
    vendor_dir = bin_dir / "vendor"
    dist_dir = root / "dist"
    archive = dist_dir / f"codex-lb-{version}-bin.tar.gz"

    if not skip_frontend:
        _run(["make", "frontend-build"], cwd=root)

    if bin_dir.exists():
        shutil.rmtree(bin_dir)
    bin_dir.mkdir(parents=True)
    dist_dir.mkdir(parents=True)

    # Isolate the install from any project .venv so --target is the only write path.
    env = os.environ.copy()
    env.pop("VIRTUAL_ENV", None)
    env.pop("UV_PROJECT_ENVIRONMENT", None)

    _run(
        [
            "uv",
            "pip",
            "install",
            "--python",
            _BUNDLE_PYTHON,
            "--target",
            str(vendor_dir),
            ".",
        ],
        cwd=root,
        env=env,
    )

    for name, body in LAUNCHERS:
        _write_launcher(bin_dir / name, body)

    # Must smoke-test with the same Python ABI used to install native wheels
    # (e.g. pydantic_core). Bare `python3` on Ubuntu runners is often 3.12.
    smoke_env = env.copy()
    smoke_env["PYTHONPATH"] = str(vendor_dir)
    _run(
        [
            "uv",
            "run",
            "--python",
            _BUNDLE_PYTHON,
            "--no-project",
            "python",
            "-c",
            "import app; import app.main; print('import ok')",
        ],
        cwd=root,
        env=smoke_env,
    )

    if archive.exists():
        archive.unlink()
    with tarfile.open(archive, "w:gz") as tar:
        tar.add(bin_dir, arcname="bin")

    print(f"wrote {archive}", flush=True)
    return archive


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=None, help="repository root")
    parser.add_argument(
        "--skip-frontend",
        action="store_true",
        help="skip frontend build (caller already built app/static)",
    )
    args = parser.parse_args(argv)
    root = (args.root or _repo_root()).resolve()
    build_bundle(root, skip_frontend=args.skip_frontend)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
