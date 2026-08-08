from pathlib import Path

import pytest

pytestmark = pytest.mark.unit

_REPO_ROOT = Path(__file__).resolve().parents[2]


def _read(relative_path: str) -> str:
    return (_REPO_ROOT / relative_path).read_text(encoding="utf-8")


@pytest.mark.parametrize(
    ("relative_path", "command"),
    [
        ("README.md", "uv run codex-lb"),
        ("README.zh-CN.md", "uv run codex-lb"),
        (
            "openspec/specs/responses-api-compat/ops.md",
            ".venv/bin/python -m app.cli --host 127.0.0.1 --port 2460",
        ),
    ],
)
def test_documented_launchers_delegate_to_app_cli(
    relative_path: str,
    command: str,
) -> None:
    assert command in _read(relative_path)


def test_bin_launcher_template_delegates_to_app_cli() -> None:
    script = _read("scripts/package_bin_bundle.py")
    assert "from app.cli import main" in script
    assert "from app.db.migrate import main" in script
    assert "sys.path.insert(0, str(_VENDOR))" in script
    assert '("codex-lb", "from app.cli import main; raise SystemExit(main())")' in script
