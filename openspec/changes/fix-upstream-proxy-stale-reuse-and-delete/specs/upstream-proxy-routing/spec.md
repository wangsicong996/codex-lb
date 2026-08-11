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


### Requirement: Operators can update existing upstream proxy endpoints

The upstream proxy admin API MUST allow an authenticated dashboard writer to
update an existing proxy endpoint's name, scheme, host, port, username,
optional password, and active flag. When the update omits a new password, the
stored password MUST remain unchanged. Credentials MUST NOT be returned in the
response. The upstream route cache MUST be invalidated before the response returns.

#### Scenario: Endpoint update changes host and keeps password

- **GIVEN** endpoint `E` exists with a stored password
- **WHEN** an admin updates `E` host/port without a password field
- **THEN** the API returns the updated endpoint metadata
- **AND** the stored password remains unchanged
- **AND** the upstream route cache is invalidated

### Requirement: Operators can update existing upstream proxy pools

The upstream proxy admin API MUST allow an authenticated dashboard writer to
update an existing proxy pool's name, active flag, and membership list. Updating
membership MUST replace the pool's endpoint membership with the supplied ordered
endpoint ids. The upstream route cache MUST be invalidated before the response
returns.

#### Scenario: Pool update replaces membership

- **GIVEN** pool `P` contains endpoints `A` and `B`
- **WHEN** an admin updates `P` with endpoint ids `[B, C]`
- **THEN** pool `P` membership becomes `B` then `C`
- **AND** the upstream route cache is invalidated
