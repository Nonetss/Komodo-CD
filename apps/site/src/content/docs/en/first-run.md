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

Open **Stacks**. Every stack of the instance appears with its state and the number of its services. The counters at the top and the filters split them into:

- **Running**: running or deploying.
- **Stopped**: stopped, down, paused or created.
- **With issues**: a failed state, an unknown one, a project that is missing on the host or missing files.

A stack is also flagged when one of its images has an update available or the deployed commit is behind the latest one. Expand a row to see its services and images, and the curl that runs each action from CI.

## 4. Run an action

Each row has three buttons, and **Deploy** (`/deploy`) does the same from a form where you pick the stack:

| Action | What Komodo does |
| --- | --- |
| **Pull** | Pulls the stack's images without restarting it (`PullStack`). |
| **Redeploy** | Brings the whole stack down and up again (`DeployStack`). |
| **Pull + Redeploy** | Both, in that order. The usual choice after pushing a new image. |

## 5. Read the history

Every action, from the dashboard or from CI, lands in **History** (`/history`): the stack, the action, who launched it, whether it worked and the message from Komodo. The page shows the last 100 actions and filters them by succeeded and failed.

## 6. Get told when a deploy fails

Optionally, the **Connection** page also takes an [ntfy](https://ntfy.sh) destination: a server (ntfy.sh or your own), a topic and, for protected topics, an access token. Whenever a deploy fails, from CI or by hand, Komodo CD publishes an alert to that topic with the stack, the action, who launched it and Komodo's error. **Send test** checks the settings before you rely on them, and alerts can be paused without deleting them.

A topic on ntfy.sh works like a password: pick one that is hard to guess, or protect it with a token.
