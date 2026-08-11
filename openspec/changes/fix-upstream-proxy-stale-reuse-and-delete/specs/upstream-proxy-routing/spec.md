## ADDED Requirements

### Requirement: Operators can delete unused upstream proxy endpoints

The upstream proxy admin API MUST allow an authenticated dashboard writer to
delete a proxy endpoint by id. Deleting an endpoint MUST remove its pool
memberships via the existing cascade and MUST invalidate the upstream route
cache before the response returns.

#### Scenario: Endpoint delete removes memberships

- **GIVEN** endpoint `E` is a member of one or more proxy pools
- **WHEN** an admin deletes `E`
- **THEN** the API returns success
- **AND** `E` is no longer listed in admin state
- **AND** no pool membership row remains for `E`
- **AND** the upstream route cache is invalidated

#### Scenario: Missing endpoint delete is rejected

- **WHEN** an admin deletes an endpoint id that does not exist
- **THEN** the API returns a dashboard validation/not-found style error

### Requirement: Operators can delete unused upstream proxy pools

The upstream proxy admin API MUST allow an authenticated dashboard writer to
delete a proxy pool by id when no account proxy binding references that pool.
Pool delete MUST fail closed with a dashboard validation error while bindings
still reference the pool. When delete succeeds, memberships cascade away, the
settings default pool FK may null out via `ON DELETE SET NULL`, and the
upstream route cache MUST be invalidated before the response returns.

#### Scenario: Pool delete succeeds without bindings

- **GIVEN** pool `P` has no account proxy bindings
- **WHEN** an admin deletes `P`
- **THEN** the API returns success
- **AND** `P` is no longer listed in admin state
- **AND** the upstream route cache is invalidated

#### Scenario: Pool delete blocked by account binding

- **GIVEN** an account still has an active or inactive binding to pool `P`
- **WHEN** an admin deletes `P`
- **THEN** the API returns a dashboard validation error
- **AND** pool `P` remains in admin state
