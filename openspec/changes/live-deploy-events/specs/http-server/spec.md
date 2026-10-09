## MODIFIED Requirements

### Requirement: Graceful shutdown

On `SIGINT` or `SIGTERM`, the backend SHALL first end every open deploy event stream, then stop accepting HTTP requests, give in-flight requests up to 5 seconds to finish before closing their connections, then close the database connection, and exit with `0` (or `1` if a step failed). The whole shutdown SHALL be bounded at 8 seconds, after which the process SHALL exit with `1`, so it always ends before Docker's 10-second kill. A second signal during shutdown SHALL be ignored.

#### Scenario: Container stop

- **WHEN** Docker sends `SIGTERM` while a deploy request is in flight
- **THEN** the backend SHALL let that request finish (up to 5 seconds), close the database and exit before Docker kills it

#### Scenario: Open event streams do not hold the drain

- **WHEN** Docker sends `SIGTERM` while two dashboards are subscribed to `v0.deploy.watch` and no other request is in flight
- **THEN** both streams SHALL end and the HTTP server SHALL stop without waiting for the 5-second drain timeout
