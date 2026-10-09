import type { Types } from "komodo_client"

/**
 * Un `StackListItem` de Komodo con lo mínimo que leen los handlers: nombre,
 * si es plantilla y la imagen de cada servicio.
 */
export function komodoStack(
  name: string,
  images: string[],
  { template = false }: { template?: boolean } = {}
) {
  return {
    id: `id-${name}`,
    type: "Stack",
    name,
    template,
    tags: [],
    info: {
      server_id: "server-1",
      files_on_host: false,
      file_contents: true,
      linked_repo: "",
      git_provider: "github.com",
      repo: "",
      branch: "main",
      repo_link: "",
      state: "running",
      status: null,
      services: images.map((image, i) => ({
        service: `svc-${i}`,
        image,
        update_available: false,
      })),
      project_missing: false,
      missing_files: [],
      deployed_hash: null,
      latest_hash: null,
    },
  } as unknown as Types.StackListItem
}
