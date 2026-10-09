---
title: Configuración
description: Cada variable de entorno del despliegue con Compose y quién la lee.
order: 5
---

Komodo CD se configura con un fichero `.env` junto a `compose.yml`. Docker Compose lo lee y pasa cada valor al contenedor que lo necesita. Todo lo demás (la conexión con Komodo, las API keys, los avisos de ntfy) se configura desde el panel y se guarda en la base de datos.

## `.env`

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `APP_URL` | Sí | URL pública de la app, sin barra final. El backend la recibe como `BETTER_AUTH_URL` y la usa para CORS y como origen de confianza al iniciar sesión. |
| `BETTER_AUTH_SECRET` | Sí | Firma sesiones y tokens. Genérala con `openssl rand -base64 32`. |
| `SEED_ADMIN_PASSWORD` | Sí | Contraseña del administrador que se crea al arrancar, de al menos 8 caracteres. |
| `PORT` | No | Puerto del host que publica el frontend. Por defecto `80`. |
| `SEED_ADMIN_EMAIL` | No | Email del administrador. Por defecto `admin@example.com`. |
| `SEED_ADMIN_NAME` | No | Nombre del administrador. Por defecto `Admin`. |
| `TRIVY_SERVER_URL` | No | Servidor de Trivy con el que el backend escanea las imágenes. Por defecto `http://trivy:4954`, el servicio `trivy` de `compose.yml`. Ponla solo para usar otro servidor. |

## La cuenta de administrador

En cada arranque el backend busca un usuario con `SEED_ADMIN_EMAIL` y lo crea si no existe. Nunca modifica un usuario existente, así que cambiar `SEED_ADMIN_PASSWORD` más tarde no restablece la contraseña de un administrador que ya está creado.

## Cambiar el secreto

`BETTER_AUTH_SECRET` se puede rotar: tras reiniciar, todas las sesiones dejan de valer y los usuarios vuelven a iniciar sesión. No lo quites ni lo dejes vacío: el backend no arranca sin él.

## Fijadas en `compose.yml`

Están fijas en el fichero de Compose y rara vez hay que cambiarlas:

| Variable | Contenedor | Valor |
| --- | --- | --- |
| `DATABASE_URL` | backend | `file:/data/db.sqlite`, dentro del volumen `db_data`. |
| `BACKEND_URL` | frontend | `http://backend:3000`, por donde el renderizado en servidor llega al backend para comprobar la sesión. |

## Escaneo de imágenes

El servicio `trivy` de `compose.yml` corre un servidor de Trivy fijado a la misma versión que el cliente que lleva la imagen del backend. En el primer arranque descarga de Internet su base de datos de vulnerabilidades en el volumen `trivy_cache` y la mantiene al día. El backend, por su parte, descarga cada imagen que escanea directamente de su registry, así que los dos necesitan salida a Internet. Hasta que la base de datos está lista, los escaneos fallan y se pueden reintentar desde la página **Seguridad**.

Las imágenes de registries privados también se intentan; cuando el backend no puede descargar una, el escaneo aparece como "sin acceso al registry" y el resto sigue.

El backend también lee `LOG_LEVEL` (`fatal`, `error`, `warn`, `info`, `debug` o `trace`; por defecto `info`). Para usarla, añádela al `environment` del backend en `compose.yml`.

## La URL de los curl

Los comandos curl que el panel muestra para cada stack usan la dirección con la que abriste el panel. Ábrelo por la URL pública a la que llamará tu CI y los comandos estarán listos para pegar.
