## REMOVED Requirements

### Requirement: Superseded beta release PR cleanup

### Requirement: Beta release PR creation parity

### Requirement: Beta release PR changelog

## ADDED Requirements

### Requirement: Beta release automation workflows are not maintained

The repository MUST NOT run beta release sync or beta publish GitHub Actions
workflows. Delivery of installable archives is owned by CI artifact upload
(see `release-management`).

#### Scenario: No beta release workflows

- **WHEN** inspecting `.github/workflows/`
- **THEN** `prepare-beta-release.yml` and `publish-beta-release.yml` are absent
