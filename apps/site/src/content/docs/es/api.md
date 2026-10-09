---
title: API REST
description: Los endpoints que hay detrás del panel, cómo autenticarse y dónde está la referencia interactiva.
order: 6
---

Todo lo que hace el panel pasa por una API que también se publica como REST bajo `/api/v0`. El endpoint de deploy es el que usa el CI; el resto está ahí para scripts.

## Autenticación

Cada endpoint necesita una de estas dos cosas:

- Una **API key** en la cabecera `x-api-key`, creada en la página **API Keys**. Es lo que usan el CI y los scripts.
- Una **cookie de sesión**, que el navegador recibe al iniciar sesión.

Sin ninguna de las dos la respuesta es `401`. Una key actúa en nombre del usuario que la creó y queda en el historial como `API Key: <nombre>`.

Una key puede listar los stacks, desplegar, seguir los deploys en vivo, leer el historial y consultar o pedir escaneos de imágenes. Borrar un stack, la conexión con Komodo, los ajustes de ntfy y las propias API keys necesitan una sesión iniciada: con una key responden `403`, así que una key del CI filtrada no puede cambiarlos.

## Referencia

El backend sirve una referencia OpenAPI interactiva, generada con Scalar, en `/scalar`, y el documento OpenAPI en `/doc`. Los dos están detrás del mismo gateway que el panel, así que en una instalación normal están en `https://deploy.example.com/scalar` y `https://deploy.example.com/doc`.

## Endpoints

| Método | Ruta | Hace |
| --- | --- | --- |
| `GET` | `/api/v0/stacks` | Lista los stacks de la instancia de Komodo, con su estado, servicios e imágenes. |
| `DELETE` | `/api/v0/stacks/{stack}` | Borra el stack en Komodo; si está en marcha, Komodo baja antes sus contenedores. Solo con sesión. |
| `POST` | `/api/v0/deploy` | Ejecuta `pull`, `redeploy` o `pull-redeploy` sobre un stack. Ver [Desplegar desde CI](../ci/). |
| `GET` | `/api/v0/deploy/events` | Stream en vivo (SSE) de los deploys según empiezan y terminan. Ver [Seguir los deploys en vivo](#seguir-los-deploys-en-vivo). |
| `GET` | `/api/v0/history` | Las últimas 100 acciones, de la más reciente a la más antigua. |
| `GET` | `/api/v0/security/images` | Cada imagen que usa algún stack, con sus stacks y su último escaneo de Trivy (estado y recuentos por severidad). Encola las que nunca se escanearon. |
| `GET` | `/api/v0/security/image?image=<ref>` | Las vulnerabilidades de una imagen: id, severidad, paquete, versión instalada y corregida, título y enlace. |
| `POST` | `/api/v0/security/scan` | Encola el escaneo de `images`, o de todas las imágenes con el cuerpo vacío. Solo acepta imágenes que use algún stack. |
| `GET` | `/api/v0/deploy/credentials` | La conexión con Komodo: id, nombre y URL, nunca la key ni el secret. |
| `POST` | `/api/v0/deploy/credentials` | Guarda la conexión (`name`, `url`, `key`, `secret`) y sustituye la actual. |
| `DELETE` | `/api/v0/deploy/credentials` | Elimina la conexión (`name`). |
| `GET` | `/api/v0/deploy/credentials/ntfy` | Los ajustes de ntfy, sin el token. |
| `POST` | `/api/v0/deploy/credentials/ntfy` | Guarda los ajustes de ntfy (`url`, `topic`, `token`, `enabled`). |
| `DELETE` | `/api/v0/deploy/credentials/ntfy` | Elimina los ajustes de ntfy. |
| `POST` | `/api/v0/deploy/credentials/ntfy/test` | Envía una notificación de prueba, con los ajustes guardados o con los del cuerpo. |
| `GET` | `/api/v0/apikeys` | Lista tus API keys (nombre, primeros caracteres, fechas). |
| `POST` | `/api/v0/apikeys` | Crea una key (`name`). La key completa solo viene en esta respuesta. |
| `DELETE` | `/api/v0/apikeys` | Borra una key (`id`). |

Las API keys se gestionan por usuario desde una sesión iniciada, que es como el panel llama a estos tres endpoints.

## Ejemplos

Listar los stacks que tienen actualización:

```bash
curl -s https://deploy.example.com/api/v0/stacks \
  -H "x-api-key: $KOMODO_API_KEY" \
  | jq -r '.stacks[] | select(any(.info.services[]; .update_available)) | .name'
```

Listar las imágenes con vulnerabilidades críticas y los stacks que las usan:

```bash
curl -s https://deploy.example.com/api/v0/security/images \
  -H "x-api-key: $KOMODO_API_KEY" \
  | jq -r '.images[] | select(.counts.critical > 0) | "\(.image)\t\(.stacks | join(","))"'
```

Ver las últimas acciones fallidas:

```bash
curl -s https://deploy.example.com/api/v0/history \
  -H "x-api-key: $KOMODO_API_KEY" \
  | jq '.history | map(select(.success == false)) | .[:5]'
```

## Seguir los deploys en vivo

`GET /api/v0/deploy/events` mantiene la conexión abierta y envía [Server-Sent Events](https://developer.mozilla.org/es/docs/Web/API/Server-sent_events) con cada deploy, lo lance quien lo lance: el panel, otro usuario o un pipeline. El panel usa este mismo stream para refrescar solas las páginas de Stacks e Historial.

El `data` de cada evento es un objeto JSON con un `type`:

- `subscribed`, una sola vez al conectar, con `running`: los deploys en curso en ese momento.
- `started`, con `run`: `id`, `stack`, `action`, `via` (`session` o `apiKey`), `actorName` y `startedAt`.
- `finished`, con el mismo `run` más `success`, `message` y `finishedAt`.

No se repiten eventos pasados: lo que ocurrió antes de conectar está en el historial. El stream vive en la memoria del backend, así que solo cubre los deploys que atiende esa instancia.

```bash
curl -N https://deploy.example.com/api/v0/deploy/events \
  -H "x-api-key: $KOMODO_API_KEY"
```
