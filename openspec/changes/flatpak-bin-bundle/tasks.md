## 1. OpenSpec and packaging

- [x] 1.1 Create change proposal/context/tasks and delta specs
- [x] 1.2 Implement `scripts/package_bin_bundle.py` + `make package-bin`
- [x] 1.3 Update main specs for deployment-installation, release-management, deployment-networking

## 2. Remove container deployment paths

- [x] 2.1 Delete Dockerfile/compose/deploy/helm/entrypoint/helm-smoke scripts
- [x] 2.2 Strip Chart.yaml from release_versions/guards/release-please
- [x] 2.3 Delete or retarget Docker/Helm unit tests

## 3. Simplify GitHub Actions

- [x] 3.1 Update ci.yml (drop docker/helm, add package-bin)
- [x] 3.2 Update release.yml and beta workflows
- [x] 3.3 Update dependabot, detect_changed_areas, sync_codex_ok_labels
- [x] 3.4 Minimal docs/nav updates so mkdocs and tests stay coherent

## 4. Verify

- [x] 4.1 Static verification of workflows/scripts/specs (local `uv`/pytest unavailable in this environment)
- [ ] 4.2 Run `make package-bin` and targeted unit tests on a host with uv + Python 3.13
