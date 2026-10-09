import type { AppRouter } from "@komodo-cd/api/router"
import type { InferRouterInputs, InferRouterOutputs } from "@orpc/server"

type Inputs = InferRouterInputs<AppRouter>["v0"]
type Outputs = InferRouterOutputs<AppRouter>["v0"]

export type DeployAction = Inputs["deploy"]["trigger"]["action"]
export type Credential = Outputs["credentials"]["list"]["credentials"][number]
export type SaveCredentialPayload = Inputs["credentials"]["save"]
export type NtfyConfig = NonNullable<
  Outputs["credentials"]["ntfy"]["get"]["config"]
>
export type HistoryItem = Outputs["history"]["list"]["history"][number]
export type ApiKey = Outputs["apiKey"]["list"]["keys"][number]

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

type StackOutput = Outputs["stacks"]["list"]["stacks"][number]

/**
 * `state` llega como string desde el backend; aquí se estrecha a los estados
 * de Komodo. Intersección y no `Omit`: el item es `looseObject` (index
 * signature) y `Omit` perdería las claves conocidas.
 */
export type Stack = StackOutput & {
  info: StackOutput["info"] & { state: StackState }
}
export type StackService = StackOutput["info"]["services"][number]

/** Evento de `v0.deploy.watch` (el stream SSE de la actividad de deploys) */
export type DeployEvent =
  Outputs["deploy"]["watch"] extends AsyncIterable<infer E> ? E : never
export type DeployRun = Extract<DeployEvent, { type: "started" }>["run"]
