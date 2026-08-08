## REMOVED Requirements

### Requirement: Beta releases are prepared through release PRs

### Requirement: Merged beta release PRs publish GitHub prereleases

### Requirement: Prerelease artifacts do not advance stable aliases

### Requirement: Stable release promotion remains release-please owned

### Requirement: Stable release promotions guard every release-managed version field

### Requirement: Failed release publishing withdraws public release metadata

## ADDED Requirements

### Requirement: CI publishes the bin archive as a workflow artifact

The CI workflow SHALL build `codex-lb-<version>-bin.tar.gz` on every run and
upload it as a GitHub Actions workflow artifact named `bin-bundle`. The project
MUST NOT require a GitHub Release, Release Please, beta-release, or Release
publishing workflow to deliver the bin archive.

#### Scenario: CI uploads bin-bundle artifact

- **WHEN** the CI `package-bin` job completes successfully
- **THEN** the run exposes a downloadable Actions artifact `bin-bundle`
- **AND** the artifact contains `codex-lb-<version>-bin.tar.gz`
