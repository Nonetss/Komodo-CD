import { cn } from "@/lib/utils"

type ParsedImage = { prefix: string; name: string; ref: string }

/**
 * Parte una referencia de imagen en registro/ruta, nombre y tag (o digest).
 * `host:5000/img` no tiene tag: los dos puntos van antes de la última barra.
 */
function parseImage(image: string): ParsedImage {
  const digest = image.match(/^(?:(.*)@)?(sha256:)([a-f0-9]+)$/)
  if (digest) {
    const path = digest[1] ?? ""
    const slash = path.lastIndexOf("/")
    return {
      prefix: path.slice(0, slash + 1),
      name: path.slice(slash + 1),
      ref: `${path ? "@" : ""}${digest[2]}${(digest[3] as string).slice(0, 12)}…`,
    }
  }
  const slash = image.lastIndexOf("/")
  const colon = image.lastIndexOf(":")
  const tagged = colon > slash
  const path = tagged ? image.slice(0, colon) : image
  return {
    prefix: path.slice(0, slash + 1),
    name: path.slice(slash + 1),
    ref: tagged ? image.slice(colon) : "",
  }
}

/**
 * Imagen de un servicio con jerarquía: el nombre en tinta, el registro
 * atenuado (y lo primero que se recorta) y el tag o digest corto al final.
 * La referencia completa queda en el `title`.
 */
export function ImageRef({
  image,
  className,
}: {
  image: string
  className?: string
}) {
  const { prefix, name, ref } = parseImage(image)
  return (
    <span
      title={image}
      className={cn(
        "flex min-w-0 font-mono text-xs tracking-tight tabular-nums",
        className
      )}
    >
      {prefix && (
        <span className="text-muted-foreground/80 min-w-0 truncate">
          {prefix}
        </span>
      )}
      {name && <span className="shrink-0">{name}</span>}
      {ref && (
        <span className={cn("shrink-0", name && "text-muted-foreground")}>
          {ref}
        </span>
      )}
    </span>
  )
}
