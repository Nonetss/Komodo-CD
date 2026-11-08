## ADDED Requirements

### Requirement: Action major version tag

`.github/workflows/action-tag.yml` SHALL run on every pushed `vX.Y.Z` tag and move the major tag `vX` to the same commit (creating it if missing, force-updating it otherwise), so `uses: <owner>/Komodo-CD@vX` follows the latest `X.*.*` release. It SHALL NOT move a major tag for pre-release tags (a version with a `-` suffix).

#### Scenario: New release

- **WHEN** the tag `v2.3.0` is pushed
- **THEN** the tag `v2` SHALL point at the `v2.3.0` commit

#### Scenario: Pre-release

- **WHEN** the tag `v3.0.0-rc.1` is pushed
- **THEN** the tag `v3` SHALL NOT be created or moved
