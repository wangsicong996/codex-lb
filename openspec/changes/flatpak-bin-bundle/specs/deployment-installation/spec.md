## REMOVED Requirements

### Requirement: Helm chart is organized around install modes

### Requirement: Helm install modes are smoke-tested

### Requirement: Helm support policy is pinned to modern Kubernetes minors

### Requirement: Helm chart fails closed when termination grace is below drain budget

### Requirement: Helm chart fails closed on invalid static session-bridge rings

### Requirement: Documented bridge ring and advertise URL examples pass application validation

### Requirement: Docker Compose deployments are declared single-replica

## ADDED Requirements

### Requirement: Vendored bin bundle installs without system site-packages

The project MUST provide a packaging path that installs the application and its
runtime Python dependencies into `bin/vendor` (or an equivalent target directory
under `bin/`) without writing to the system or runtime site-packages. The
bundle MUST include executable launchers `bin/codex-lb` and `bin/codex-lb-db`
that set `PYTHONPATH` to the vendored tree and invoke the application CLI /
migration entrypoints. Packaging MUST build frontend static assets into the
installed application package before creating the vendor tree. CI MUST produce
a versioned archive named `codex-lb-<version>-bin.tar.gz` whose archive root is
the `bin/` directory and MUST upload it as a GitHub Actions workflow artifact.
This repository MUST NOT ship a Flatpak manifest; external Flatpak packaging
consumes the archive.

#### Scenario: Local package-bin creates vendor tree and launchers

- **WHEN** an operator runs `make package-bin`
- **THEN** `bin/vendor` contains importable `app` and its runtime dependencies
- **AND** `bin/codex-lb` and `bin/codex-lb-db` exist and are executable
- **AND** `dist/codex-lb-<version>-bin.tar.gz` exists with `bin/` as the archive root

#### Scenario: Vendored import does not require system site-packages for project deps

- **WHEN** `PYTHONPATH=bin/vendor` is set and the system site-packages lack project deps
- **THEN** `python3 -c "import app; import app.main"` succeeds using only the vendor tree plus the interpreter stdlib

#### Scenario: CI publishes the bin archive as a workflow artifact

- **WHEN** the CI `package-bin` job completes successfully
- **THEN** it uploads `codex-lb-<version>-bin.tar.gz` as the Actions artifact `bin-bundle`

## MODIFIED Requirements

### Requirement: Owned launch paths preserve raw peer before proxy projection

Every project-owned launch path for the main application MUST disable server-level proxy-header projection. The outermost application middleware MUST preserve the incoming HTTP or WebSocket `scope["client"]` before applying Uvicorn-compatible proxy projection exactly once. Downstream consumers MUST continue to observe Uvicorn's projected client and scheme. Projection MUST use `FORWARDED_ALLOW_IPS` unchanged: unset MUST trust `127.0.0.1`, empty MUST trust no peer, `*` MUST trust every peer, and explicit hosts or networks MUST retain Uvicorn's parsing and trusted-chain behavior. The change MUST NOT introduce a new setting.

#### Scenario: Owned launchers disable early projection

- **WHEN** the main application starts through the project CLI or the vendored `bin/codex-lb` launcher
- **THEN** server-level proxy-header projection is disabled
- **AND** application capture and projection run exactly once

#### Scenario: HTTP and WebSocket preserve both identities

- **WHEN** a trusted peer sends valid `X-Forwarded-For` and `X-Forwarded-Proto` headers over HTTP or WebSocket
- **THEN** the raw transport peer remains preserved
- **AND** downstream handling observes Uvicorn's projected client and protocol-appropriate scheme

#### Scenario: Forwarded allowlist behavior is unchanged

- **WHEN** `FORWARDED_ALLOW_IPS` is unset, empty, `*`, or an explicit host/network list
- **THEN** proxy projection follows Uvicorn's existing trust semantics

### Requirement: Removed tunables are fixed constants or derived values

Values that are protocol constants or internal tuning details SHALL NOT be
operator-configurable. When a previously supported `CODEX_LB_*` setting is
removed from the configuration surface, its environment variable MUST be
ignored without failing startup, and for at least one release after removal,
startup MUST emit a single warning log listing every removed setting name
found in the process environment (never the values), referencing the
simplicity principle that motivated the removal. Each subsystem affected by
a removal MUST retain at most one enable/disable setting.

(The fixed/derived value lists and non-Helm scenarios remain unchanged; the
Helm chart rendering scenario is removed with the chart.)
