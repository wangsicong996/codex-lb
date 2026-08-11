## MODIFIED Requirements

### Requirement: Routed HTTP proxy attempts recover from stale keep-alive disconnects

When the Codex upstream client sends an HTTP/HTTPS dashboard-routed proxy
request and the first attempt fails before a response is returned with a stale
keep-alive transport error (`ServerDisconnectedError` or a non-connector
`ClientOSError`), the client MUST retry the same endpoint once on a fresh
connection attempt before failing that endpoint or falling back.

#### Scenario: Half-closed proxy tunnel reconnects once

- **GIVEN** a routed HTTP proxy endpoint whose pooled keep-alive connection is half-closed
- **WHEN** the Codex upstream client issues a request through that endpoint
- **AND** the first attempt raises `ServerDisconnectedError` before a response returns
- **THEN** the client retries the same endpoint once
- **AND** a successful second attempt returns that response without same-pool fallback

#### Scenario: Reconnect failure remains classified for same-pool fallback

- **GIVEN** both the first attempt and the same-endpoint reconnect fail with `ServerDisconnectedError`
- **WHEN** another endpoint remains in the resolved pool
- **THEN** the failure is treated as a pre-dispatch connection failure
- **AND** same-pool fallback MAY continue under the existing retryable-same-contract rules
