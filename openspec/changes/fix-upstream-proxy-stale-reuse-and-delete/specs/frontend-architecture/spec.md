## MODIFIED Requirements

### Requirement: Dashboard settings must expose upstream proxy routing controls
The settings dashboard MUST allow operators to inspect upstream proxy routing state, enable or disable routing, choose the default proxy pool, create proxy endpoints, create proxy pools, add endpoints to pools, delete proxy endpoints, and delete proxy pools that are not referenced by account bindings.

#### Scenario: Operator creates a pool from existing endpoints
- **GIVEN** the upstream proxy admin API returns at least one endpoint
- **WHEN** an operator creates a pool and selects endpoint members
- **THEN** the dashboard MUST call the pool creation API with the selected endpoint ids
- **AND** refresh the displayed upstream proxy admin state.

#### Scenario: Operator deletes an endpoint
- **GIVEN** the upstream proxy admin state lists endpoint `E`
- **WHEN** an operator confirms delete for `E`
- **THEN** the dashboard MUST call the endpoint delete API
- **AND** refresh the displayed upstream proxy admin state

#### Scenario: Operator deletes an unused pool
- **GIVEN** the upstream proxy admin state lists pool `P`
- **WHEN** an operator confirms delete for `P`
- **THEN** the dashboard MUST call the pool delete API
- **AND** refresh the displayed upstream proxy admin state
