import { z } from "zod"

// Espejo de `Types.StackListItem` de komodo_client, validando lo que usa el
// dashboard. Es `looseObject` para no perder los campos que añadan versiones
// nuevas de Komodo (p. ej. `swarm_id`, `server_name`), y los opcionales son
// `nullish` porque la API real devuelve `null` donde los tipos dicen `?:`.
const stackService = z.looseObject({
  service: z.string(),
  image: z.string(),
  update_available: z.boolean(),
})

const stackInfo = z.looseObject({
  server_id: z.string(),
  files_on_host: z.boolean(),
  file_contents: z.boolean(),
  linked_repo: z.string(),
  git_provider: z.string(),
  repo: z.string(),
  branch: z.string(),
  repo_link: z.string(),
  state: z.string(),
  status: z.string().nullish(),
  services: z.array(stackService),
  project_missing: z.boolean(),
  missing_files: z.array(z.string()),
  deployed_hash: z.string().nullish(),
  latest_hash: z.string().nullish(),
})

const stackItem = z.looseObject({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  template: z.boolean(),
  tags: z.array(z.string()),
  info: stackInfo,
})

export type StackItem = z.infer<typeof stackItem>

export const stacksOutput = {
  list: z.object({
    success: z.boolean(),
    stacks: z.array(stackItem),
  }),
  remove: z.object({
    success: z.boolean(),
    stack: z.string(),
    message: z.string(),
  }),
  pollForUpdates: z.object({
    success: z.boolean(),
    stack: z.string(),
    enabled: z.boolean(),
  }),
}
