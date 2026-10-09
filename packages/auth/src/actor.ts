// Convenio con el que se guarda en el historial quién lanzó una acción. Una
// petición con API key no tiene usuario propio: se registra con el nombre
// "API Key: <nombre de la key>" (o "API Key" si no tiene nombre) y sin email.
// Se escribe en resolveSession y se vuelve a leer al listar el historial.

const API_KEY_ACTOR = "API Key"
const API_KEY_ACTOR_PREFIX = `${API_KEY_ACTOR}: `

export type ActorVia = "session" | "apiKey"

/** Nombre con el que se registra una petición hecha con API key. */
export const apiKeyActorName = (keyName?: string | null) =>
  keyName ? `${API_KEY_ACTOR_PREFIX}${keyName}` : API_KEY_ACTOR

/**
 * Quién lanzó una acción, a partir de lo guardado. Solo es una API key si no
 * hay email (un usuario de verdad siempre lo tiene) y el nombre sigue el
 * convenio; si no, es un usuario con sesión.
 */
export function parseActor({
  userId,
  userName,
  userEmail,
}: {
  userId: string
  userName?: string | null
  userEmail?: string | null
}): { via: ActorVia; actorName: string | null } {
  if (!userEmail && userName === API_KEY_ACTOR) {
    return { via: "apiKey", actorName: null }
  }
  if (!userEmail && userName?.startsWith(API_KEY_ACTOR_PREFIX)) {
    return {
      via: "apiKey",
      actorName: userName.slice(API_KEY_ACTOR_PREFIX.length) || null,
    }
  }
  return { via: "session", actorName: userName || userEmail || userId }
}
