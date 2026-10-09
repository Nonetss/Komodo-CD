## MODIFIED Requirements

### Requirement: Tier per procedure

What CI needs SHALL use `protectedProcedure`: `v0.deploy.trigger`, `v0.deploy.watch`, `v0.stacks.list` and `v0.history.list`. Everything that reads or changes configuration or credentials SHALL use `sessionProcedure`: every `v0.credentials.*` procedure (Komodo connection and ntfy) and every `v0.apiKey.*` procedure. A new procedure SHALL pick its tier by the same rule.

#### Scenario: CI cannot mint keys

- **WHEN** a request authenticated with `x-api-key` calls `v0.apiKey.create`
- **THEN** it SHALL fail with `FORBIDDEN` and no key SHALL be created

#### Scenario: Signed-in user configures Komodo

- **WHEN** a signed-in browser session calls `v0.credentials.save`
- **THEN** the call SHALL be authorized

#### Scenario: CI watches deploys

- **WHEN** a request authenticated with `x-api-key` calls `v0.deploy.watch`
- **THEN** the call SHALL be authorized and stream deploy events
