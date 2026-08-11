## ADDED Requirements

### Requirement: Dashboard must expose a dedicated Proxy page for upstream proxy controls
The dashboard MUST provide a core navigation destination `/proxy` labeled for
proxy administration, placed immediately after Settings in the core nav. That
page MUST allow operators to inspect upstream proxy routing state, enable or
disable routing, choose the default proxy pool, create/edit/delete proxy
endpoints, create/edit/delete proxy pools, add endpoints to pools, and test
endpoints.

#### Scenario: Operator opens Proxy from core nav
- **WHEN** an operator activates the Proxy nav item
- **THEN** the dashboard navigates to `/proxy`
- **AND** the upstream proxy administration UI is mounted on that page

#### Scenario: Operator creates a pool from existing endpoints
- **GIVEN** the upstream proxy admin API returns at least one endpoint
- **WHEN** an operator creates a pool and selects endpoint members on the Proxy page
- **THEN** the dashboard MUST call the pool creation API with the selected endpoint ids
- **AND** refresh the displayed upstream proxy admin state.

## MODIFIED Requirements

### Requirement: Settings page
The Settings page SHALL display appearance settings, account import settings,
reset-credit visibility/auto-redeem settings, dashboard authentication settings
(API key auth toggle, weekly pace target, prefer earlier reset, prefer earlier
reset priority, prompt-cache affinity TTL, weekly pace controls, limit warm-up
controls, and Fast Mode prohibition), password management
(setup/change/remove), TOTP management (setup/disable), API key auth toggle,
API key management (table, create, edit, delete, regenerate), and
sticky-session administration. API key create/edit controls that expose
reasoning effort choices MUST include upstream-supported extended efforts such
as `max` and `ultra`.

Advanced sections — routing settings, model sources, firewall, quota phase
planner, sticky-session administration, and data retention — SHALL render inside
an Advanced settings group that is collapsed by default. Expanding the group
SHALL take exactly one interaction, after which every advanced section is fully
functional. While the group is collapsed, its sections SHALL NOT mount, and the
sections that self-fetch on mount — model sources, firewall, quota phase planner,
and sticky-session administration — SHALL NOT issue their data requests; those
requests fire when the group is expanded. Core sections (appearance, import,
guest access, password/session/TOTP when applicable, and API keys) remain visible
without expanding Advanced. Upstream proxy administration SHALL NOT live on the
Settings page; it SHALL live on the dedicated Proxy page.

#### Scenario: Advanced settings collapsed by default

- **WHEN** a user opens the Settings page
- **THEN** appearance, import, and API key management sections are visible
- **AND** the advanced sections (routing, model sources, firewall, quota planner, sticky sessions, data retention) are not mounted
- **AND** the self-fetching sections (model sources, firewall, quota planner, sticky sessions) have not issued their data requests
- **AND** the Settings page does not issue an upstream-proxy admin query solely to render Settings content

#### Scenario: One interaction expands every advanced section

- **WHEN** a user activates the Advanced settings group trigger
- **THEN** the routing, model sources, firewall, quota planner, sticky-session, and data-retention sections mount and become fully functional

### Requirement: Dashboard settings must expose upstream proxy routing controls
The Proxy page MUST allow operators to inspect upstream proxy routing state,
enable or disable routing, choose the default proxy pool, create proxy
endpoints, create proxy pools, and add endpoints to pools. The Settings page
MUST NOT host this administration UI.

#### Scenario: Operator creates a pool from existing endpoints
- **GIVEN** the upstream proxy admin API returns at least one endpoint
- **WHEN** an operator creates a pool and selects endpoint members on the Proxy page
- **THEN** the dashboard MUST call the pool creation API with the selected endpoint ids
- **AND** refresh the displayed upstream proxy admin state.

### Requirement: Upstream proxy admin creation flows use modal dialogs

The Proxy page upstream proxy section SHALL present endpoint creation, pool
creation, and pool-member addition as modal dialogs opened from explicit trigger
buttons. The creation form fields (endpoint name/scheme/host/port/credentials,
pool name/member selection, pool-member pool/endpoint selectors) SHALL NOT be
rendered in the always-visible Proxy page layout; they SHALL only mount when
their dialog is open. Submitting a creation dialog SHALL call the existing
upstream proxy admin mutation, refresh the displayed admin state, and close the
dialog on success; a failed submission SHALL keep the dialog open so the
operator can retry.

#### Scenario: Creation forms are hidden until a dialog opens

- **WHEN** an operator views the Proxy page upstream proxy section
- **THEN** no endpoint, pool, or pool-member creation input fields are present in the document
- **AND** the section shows trigger buttons for adding an endpoint, creating a pool, and adding a pool member

#### Scenario: Operator creates a pool from a dialog

- **GIVEN** the upstream proxy admin API returns at least one endpoint
- **WHEN** an operator opens the create-pool dialog, names the pool, selects endpoint members, and submits
- **THEN** the dashboard calls the pool creation API with the selected endpoint ids
- **AND** refreshes the displayed upstream proxy admin state
- **AND** closes the dialog

#### Scenario: Failed creation keeps the dialog open

- **WHEN** a creation dialog submission rejects with an error
- **THEN** the dialog remains open
- **AND** the entered values are preserved so the operator can retry

### Requirement: Upstream proxy admin section summarizes configured endpoints and pools

The always-visible Proxy page upstream proxy section SHALL render a
summary/management view that shows the routing-enabled toggle, the default-pool
selector, and readable lists of the configured endpoints and pools (including
each pool's active state and endpoint count). When no endpoints or no pools are
configured, the section SHALL show an explicit empty state for that list rather
than a blank region.

#### Scenario: Configured endpoints and pools are listed

- **WHEN** the upstream proxy admin state includes endpoints and pools
- **THEN** the section lists each endpoint with its scheme, host, and port
- **AND** lists each pool with its active state and endpoint count

#### Scenario: Empty proxy configuration shows an empty state

- **WHEN** the upstream proxy admin state has no endpoints and no pools
- **THEN** the section shows an explicit empty-state message for endpoints and for pools

### Requirement: Header navigation progressive disclosure
The dashboard header MUST keep the everyday destinations Dashboard, Reports,
Accounts, APIs, Settings, and Proxy in the always-visible core nav, and MUST
keep Automations behind a single Advanced disclosure control rather than as an
always-visible peer of the core destinations. New page-level destinations MUST
default into Advanced unless a change explicitly specifies them as core; this
change explicitly specifies Proxy as core.

#### Scenario: Advanced menu reveals Automations
- **WHEN** an operator opens the Advanced disclosure in the dashboard header
- **THEN** Automations is available as a navigation target
- **AND** Proxy remains visible in the core nav without opening Advanced

#### Scenario: Automations is not a top-level item

- **WHEN** a user views the header navigation
- **THEN** Dashboard, Reports, Accounts, APIs, Settings, and Proxy render as top-level links
- **AND** Automations does not render as a top-level link
