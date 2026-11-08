## MODIFIED Requirements

### Requirement: CI snippet

The Deploy page, the detail of each stack on the Stacks page and the freshly created API key panel SHALL show the action ready to copy for CI, with a selector between two formats, `curl` (the default) and `GitHub Action`, at the head of the code block next to the copy button:

- `curl`: a `curl` command for `POST <app-url>/api/v0/deploy` with the headers `x-api-key` and `Content-Type: application/json` and the JSON body `{"stack":…,"action":…}`, built by `buildDeployCurl`. Unless a real key is being shown, the key SHALL be the placeholder `<api-key>`, and a hint SHALL say to replace it with a key from the API Keys page (linked).
- `GitHub Action`: a workflow step built by `buildDeployWorkflowStep` that uses the repository's action (`Nonetss/Komodo-CD@v2`) with the inputs `url`, `api-key`, `stack` and `action`. `api-key` SHALL always be `${{ secrets.KOMODO_API_KEY }}`, never the key itself, also on the freshly created key panel; a hint SHALL say to store a key from the API Keys page (linked), or the key just created, in the repository secret `KOMODO_API_KEY`. Values that YAML would not read verbatim SHALL be double-quoted.

In both formats the URL SHALL be `PUBLIC_APP_URL` when it was set at build time, otherwise the browser's origin after hydration, and the copy button SHALL copy the code of the selected format.

#### Scenario: Snippet follows the form

- **WHEN** the user types stack `api` and picks `pull` on the Deploy page
- **THEN** the snippet SHALL read `curl -X POST <app-url>/api/v0/deploy` with body `{"stack":"api","action":"pull"}`

#### Scenario: Switch to the GitHub Action

- **WHEN** the user picks `GitHub Action` on the snippet of stack `web` with action `redeploy`
- **THEN** the block SHALL show a step with `uses: Nonetss/Komodo-CD@v2`, `stack: web`, `action: redeploy` and `api-key: ${{ secrets.KOMODO_API_KEY }}`, and copying SHALL copy that step

#### Scenario: New key in the GitHub Action format

- **WHEN** the freshly created key panel shows the `GitHub Action` format
- **THEN** the step SHALL NOT contain the key, and the hint SHALL say to store it in the secret `KOMODO_API_KEY`
