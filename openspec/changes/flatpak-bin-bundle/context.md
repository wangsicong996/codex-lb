## Context

Flatpak consumers need a relocatable Python dependency tree that does not
install into the host or runtime system site-packages. The project ships a
`bin/` layout built by CI as an Actions artifact; an external Flatpak manifest copies that
tree into `/app` (or equivalent) and uses the Flatpak Python 3.13 runtime.

## Decisions

- Vendor with `uv pip install --target bin/vendor` rather than bundling CPython.
- Keep launchers as thin `PYTHONPATH` wrappers so Flatpak can `exec` them.
- Delete Docker/Helm instead of leaving unsupported stubs that CI still builds.
- Deliver `*-bin.tar.gz` via CI `upload-artifact` (`bin-bundle`); no GitHub Release
  or Release Please publishing workflow.
- Do not add a Flatpak manifest to this repository (external packaging owns it).

## Non-goals

- Publishing to Flathub from this repo.
- Multi-arch binary wheels beyond what `uv` resolves on the CI runner.
- Preserving Helm multi-replica installs as a first-party path.

## Example

```bash
make package-bin
# produces dist/codex-lb-1.23.0-bin.tar.gz containing bin/{codex-lb,codex-lb-db,vendor/}
tar -tzf dist/codex-lb-*-bin.tar.gz | head
PYTHONPATH=bin/vendor python3 -c "import app; import app.main"
```
