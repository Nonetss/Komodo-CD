---
title: Arquitectura
description: Los tres contenedores, el recorrido de una petición por ellos y lo que guarda Komodo CD.
order: 7
---

Komodo CD es una capa fina entre personas, pipelines y una instancia de Komodo. No despliega nada por sí mismo: se lo pide a Komodo.

## Servicios

| Servicio | Imagen | Dentro |
| --- | --- | --- |
| `gateway` | `ghcr.io/nonetss/komodo-cd-gateway` | Caddy en el puerto `80`, el único publicado. Enruta cada petición y añade unas cabeceras de seguridad básicas. |
| `frontend` | `ghcr.io/nonetss/komodo-cd-frontend` | Astro SSR (islas de React) en el puerto `4321`, accesible solo dentro de la red de Compose. |
| `backend` | `ghcr.io/nonetss/komodo-cd-backend` | Bun + Hono en el puerto `3000`: Better Auth, la API oRPC, su versión REST y la referencia OpenAPI. |

El backend guarda sus datos en un fichero SQLite, `/data/db.sqlite`, en el volumen `db_data`. No hay servidor de base de datos.

## Enrutado

El gateway reparte el tráfico:

| Petición | Va a |
| --- | --- |
| `/rpc/*` | Backend: el protocolo RPC tipado que usa el panel. |
| `/api/*` | Backend: la API REST (`/api/v0/*`) y Better Auth (`/api/auth/*`). |
| `/doc`, `/scalar` | Backend: documento OpenAPI y referencia interactiva. |
| Todo lo demás | Astro SSR, que renderiza el panel. |

Astro comprueba la sesión en cada página desde el servidor, a través del backend, y redirige al inicio de sesión cuando no hay.

## Quién pregunta

Cada petición a la API se resuelve a un usuario antes de ejecutarse:

1. Si lleva `x-api-key`, se verifica la key y la petición actúa como su dueño, con el nombre `API Key: <nombre>`.
2. Si no, se comprueba la cookie de sesión de Better Auth.
3. Sin ninguna de las dos, la respuesta es `401`.

## Cómo habla con Komodo

El backend carga la conexión con Komodo de la base de datos al arrancar y cada vez que se guarda, y mantiene un cliente para ella. Con ese cliente:

- Lee `ListStacks` en cada petición de stacks, pidiendo todas las páginas en Komodo v2. No guarda ni cachea nada de los stacks.
- Ejecuta `PullStack` y `DeployStack` para las tres acciones. Pull + Redeploy es una y después la otra.

Komodo hace entonces el trabajo en tus servidores a través de sus agentes Periphery, igual que con una acción lanzada desde su propia interfaz.

## Después de una acción

Cada acción, haya ido bien o no, se escribe en el historial con el usuario, el stack, la acción y el mensaje. Cuando una falla y los avisos de ntfy están activos, el backend publica un aviso en el topic configurado. Un servidor ntfy lento o caído nunca retrasa el deploy: el aviso se abandona a los cinco segundos y el fallo solo se registra en el log.

## Qué se guarda

| Dato | Dónde |
| --- | --- |
| Usuarios, sesiones y API keys | Tablas de Better Auth. |
| La conexión con Komodo (nombre, URL, key y secret) | Tabla `komodo`. La API nunca devuelve la key ni el secret. |
| Ajustes de ntfy (servidor, topic, token, activo o no) | Tabla `ntfy`. El token tampoco se devuelve nunca. |
| Historial de acciones | Tabla `action_history`. |

Todo está en el volumen `db_data`: ver [Actualizaciones y copias](../upgrading/).
