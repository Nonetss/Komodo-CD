import axios from "axios"

const api = axios.create({
  baseURL: "/api/v0",
  withCredentials: true,
})

export interface Credential {
  id: number
  name: string | null
  url: string | null
}

export interface SaveCredentialPayload {
  name: string
  url: string
  key: string
  secret: string
}

export type DeployAction = "pull" | "redeploy" | "pull-redeploy"

export interface TriggerDeployPayload {
  stack: string
  action: DeployAction
}

export const credentialsApi = {
  list: () =>
    api.get<{ success: boolean; credentials: Credential[] }>(
      "/deploy/credentials"
    ),
  save: (data: SaveCredentialPayload) =>
    api.post<{ success: boolean; message: string; name: string }>(
      "/deploy/credentials",
      data
    ),
  delete: (name: string) =>
    api.delete<{ success: boolean; message: string }>("/deploy/credentials", {
      data: { name },
    }),
}

export const deployApi = {
  trigger: (data: TriggerDeployPayload) =>
    api.post<{
      success: boolean
      message: string
      stack: string
      action: string
    }>("/deploy", data),
}

export type StackState =
  | "running"
  | "deploying"
  | "stopped"
  | "paused"
  | "created"
  | "restarting"
  | "dead"
  | "removing"
  | "unhealthy"
  | "down"
  | "unknown"

export interface StackService {
  service: string
  image: string
  update_available: boolean
}

export interface StackInfo {
  state: StackState
  status?: string
  server_id: string
  repo: string
  branch: string
  repo_link: string
  deployed_hash?: string
  latest_hash?: string
  services: StackService[]
  project_missing: boolean
  missing_files: string[]
}

export interface Stack {
  id: string
  name: string
  tags: string[]
  info: StackInfo
}

export const stacksApi = {
  list: () => api.get<{ success: boolean; stacks: Stack[] }>("/stacks"),
}

export interface ApiKey {
  id: string
  name: string | null
  start: string | null
  createdAt: string
  expiresAt: string | null
}

export interface HistoryItem {
  id: number
  userId: string
  userName: string | null
  userEmail: string | null
  stack: string
  action: string
  success: boolean
  message: string | null
  createdAt: string
}

export const historyApi = {
  list: () => api.get<{ success: boolean; history: HistoryItem[] }>("/history"),
}

export const apiKeysApi = {
  list: () => api.get<{ success: boolean; keys: ApiKey[] }>("/apikeys"),
  create: (name: string) =>
    api.post<{
      success: boolean
      key: string
      id: string
      name: string | null
    }>("/apikeys", { name }),
  delete: (id: string) =>
    api.delete<{ success: boolean }>("/apikeys", { data: { id } }),
}
