# release-management Specification

## Purpose

Define how versioned installable artifacts are delivered. The bin bundle is
published from CI as a GitHub Actions workflow artifact; GitHub Release /
Release Please / beta-release publishing workflows are out of scope.

## Requirements

### Requirement: CI publishes the bin archive as a workflow artifact

The CI workflow SHALL build `codex-lb-<version>-bin.tar.gz` on every run and
upload it as a GitHub Actions workflow artifact named `bin-bundle`. The project
MUST NOT require a GitHub Release, Release Please, beta-release, or Release
publishing workflow to deliver the bin archive.

#### Scenario: CI uploads bin-bundle artifact

- **WHEN** the CI `package-bin` job completes successfully
- **THEN** the run exposes a downloadable Actions artifact `bin-bundle`
- **AND** the artifact contains `codex-lb-<version>-bin.tar.gz`
