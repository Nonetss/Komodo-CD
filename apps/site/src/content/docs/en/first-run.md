---
title: Connect Komodo
description: Point Komodo CD at your Komodo instance, check the state of your stacks and run a first deploy by hand.
order: 2
---

A fresh installation has no Komodo connection yet, so the stacks list is empty. This walkthrough connects it and runs a first action.

## 1. Create a key in Komodo

Komodo CD talks to the Komodo Core API with an API key and secret.

1. Open your Komodo instance.
2. Go to **Settings → API Keys**.
3. Create a new key and copy both the **key** and the **secret**.

A Komodo API key acts as the user that created it, and Komodo CD runs Komodo's own `PullStack` and `DeployStack` with it, so create it as a user that can see and deploy those stacks.

## 2. Add the connection

In Komodo CD, open **Connection** (`/credentials`) and fill in a name, the instance URL (for example `https://komodo.example.com`), the key and the secret. Komodo CD keeps a single connection: saving again replaces it.

The key and secret are stored in the backend's database and are used only to call Komodo. The API lists the connection by name and URL and never returns the credentials.

Once it is saved, the page shows the status of the connection and how many stacks it sees.

## 3. Check your stacks

The **Overview** (`/`, where you land after signing in) gathers the key figures of the instance in three blocks:

- **Stacks**: how many are running, have a problem or are stopped, the services with a newer image and the stacks with a new commit, and which stacks need attention (a failed or unknown state, a project missing on the host or missing files) or have something new to deploy.
- **Security**: how many images have been scanned, which ones have critical vulnerabilities, the CVEs by severity and the most exposed images (see the Security page).
- **Deployments**: the deploys and pulls of the last 30 days, per day, with the success rate, the share launched from CI, the most deployed stacks and the latest failures.

Below them come the **Running** and **Stopped** stacks.

**Stacks** (`/stacks`) is the full list, with search and the filters **Running** (running or deploying), **Stopped** (stopped, down, paused or created) and **Issues**. Click a stack to open its page at `/stacks/<name>`: its services and images, which ones have a new image, the deployed and latest commits, and the curl that runs each action from CI.

## 4. Run an action

A stack's page has three buttons, and **Deploy** (`/deploy`) does the same from a form where you pick the stack:

| Action | What Komodo does |
| --- | --- |
| **Pull** | Pulls the stack's images without restarting it (`PullStack`). |
| **Redeploy** | Brings the whole stack down and up again (`DeployStack`). |
| **Pull + Redeploy** | Both, in that order. The usual choice after pushing a new image. |

To run one action on several stacks, tick them in the **Stacks** list and pick it in the bar that appears; Komodo CD launches at most three at a time and reports them in a single message.

## 5. Read the history

Every action, from the dashboard or from CI, lands in **History** (`/history`): the stack, the action, who launched it, whether it worked and the message from Komodo. The page shows the last 100 actions and filters them by succeeded and failed.

## 6. Get told when a deploy fails

Optionally, the **Connection** page also takes an [ntfy](https://ntfy.sh) destination: a server (ntfy.sh or your own), a topic and, for protected topics, an access token. Whenever a deploy fails, from CI or by hand, Komodo CD publishes an alert to that topic with the stack, the action, who launched it and Komodo's error. **Send test** checks the settings before you rely on them, and alerts can be paused without deleting them.

A topic on ntfy.sh works like a password: pick one that is hard to guess, or protect it with a token.
