## REMOVED Requirements

### Requirement: NetworkPolicy ingress defaults fail closed

### Requirement: Stock Docker networking explains network switching

### Requirement: Shipped overlays that enable NetworkPolicy with Ingress allow ingress-controller traffic

### Requirement: Missing NetworkPolicy ingress allowlist warns at install time

### Requirement: nginx ingress annotations render as a coherent set

### Requirement: Responses sticky routing defaults are admission-safe on stock ingress-nginx

## ADDED Requirements

### Requirement: Host and Flatpak networking are operator-owned

The project MUST NOT ship Docker Compose, Dockerfile, or Helm chart networking
defaults. Network exposure, DNS, and reverse-proxy configuration for host,
uvx, bin-bundle, and external Flatpak installs are operator-owned and MUST be
documented as such rather than as project-rendered chart or compose contracts.

#### Scenario: Repository no longer ships container networking manifests

- **WHEN** an operator inspects the repository for first-party deployment manifests
- **THEN** no Dockerfile, docker-compose file, or Helm chart is present
- **AND** documentation directs operators to host/uvx/bin-bundle or an external Flatpak
