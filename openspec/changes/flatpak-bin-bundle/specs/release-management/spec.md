## MODIFIED Requirements

### Requirement: Beta releases are prepared through release PRs

Beta releases SHALL be prepared by an automatically maintained pull request against `main` that updates the release-managed version files to `X.Y.Z-beta.N`. The beta preparation flow SHALL run after release-please completes and after pushes to `main`, SHALL derive `X.Y.Z` from the open release-please PR branch, and SHALL do nothing when there is no open release-please PR. Beta release PRs SHALL NOT update `.github/release-please-manifest.json` because stable version ownership remains with release-please.

#### Scenario: automation-generated beta PR starts unvalidated

- **GIVEN** the beta PR sync workflow creates or updates `release/beta-1.20.0-beta.3`
- **WHEN** it writes the pull request body
- **THEN** the body includes a `Release-candidate validation` section
- **AND** the section records the exact beta PR head SHA as the validated candidate placeholder
- **AND** backend, frontend, wheel/package, bin-bundle smoke, and live upstream/account smoke checklist items start unchecked

### Requirement: Prerelease artifacts do not advance stable aliases

The release publishing workflow SHALL accept both stable tags (`vX.Y.Z`) and prerelease tags (`vX.Y.Z-alpha.N`, `vX.Y.Z-beta.N`, `vX.Y.Z-rc.N`). For prerelease tags, the GitHub Release SHALL remain marked as a prerelease and not latest. Stable tags SHALL retain existing latest-release behavior. The release SHALL publish PyPI artifacts and the vendored `codex-lb-<version>-bin.tar.gz` archive; it MUST NOT publish Docker images or Helm charts.

#### Scenario: beta release publishes prerelease GitHub assets without stable latest

- **GIVEN** release tag `v1.19.0-beta.1`
- **WHEN** the release publishing workflow completes
- **THEN** it publishes PyPI artifacts and `codex-lb-1.19.0-beta.1-bin.tar.gz`
- **AND** the GitHub Release remains a prerelease and is not marked latest

### Requirement: Stable release promotion remains release-please owned

A beta-tested release train SHALL be promoted by merging the normal release-please stable release PR for the corresponding base version. Stable promotion SHALL rebuild PyPI, bin-bundle, and GitHub Release artifacts with the stable version instead of retagging prerelease artifacts.

#### Scenario: beta train is promoted to stable

- **GIVEN** `v1.19.0-beta.2` was published from `main`
- **AND** release-please has prepared the stable release PR for `1.19.0`
- **WHEN** the stable release PR is merged
- **THEN** release-please creates the stable `v1.19.0` release
- **AND** the release publishing workflow publishes stable PyPI and bin-bundle artifacts for `1.19.0`

### Requirement: Stable release promotions guard every release-managed version field

Stable release promotion pull requests SHALL fail CI unless every release-managed version field agrees on the stable version and every field that previously held the prior release train version advances together. The guarded fields SHALL include `pyproject.toml`, `app/__init__.py`, `frontend/package.json`, and the editable `codex-lb` entry in `uv.lock`.

#### Scenario: release-please stable PR misses uv.lock

- **GIVEN** a beta-tested release train has release-managed files at `1.20.0-beta.3`
- **AND** a release-please stable PR changes `pyproject.toml`, `app/__init__.py`, and `frontend/package.json` to `1.20.0`
- **BUT** leaves `uv.lock` at `1.20.0-beta.3`
- **WHEN** CI evaluates the stable release guard
- **THEN** the guard fails before the PR can merge
- **AND** the failure identifies `uv.lock` as a release-managed version field that must be updated

#### Scenario: release-please stable PR updates all release-managed fields

- **GIVEN** a beta-tested release train has release-managed files at `1.20.0-beta.3`
- **WHEN** a release-please stable PR changes all release-managed version fields to `1.20.0`
- **THEN** the stable release guard passes

### Requirement: Failed release publishing withdraws public release metadata

If the Release workflow is triggered by a public GitHub Release event and any required publishing job fails, the workflow SHALL make that GitHub Release draft again before exiting. This prevents `/releases/latest` and dashboard update checks from advertising a version whose PyPI or bin-bundle artifacts are incomplete.

#### Scenario: stable release workflow fails before artifacts publish

- **GIVEN** GitHub Release `v1.20.0` was published and triggered the Release workflow
- **AND** the workflow fails before PyPI and bin-bundle artifacts are all published
- **WHEN** the failure cleanup job runs
- **THEN** the GitHub Release is changed back to draft
- **AND** the release no longer appears as the public latest release
