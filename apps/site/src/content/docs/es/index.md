---
title: Primeros pasos
description: Instala Komodo CD junto a tu instancia de Komodo con un solo comando e inicia sesión por primera vez.
order: 1
---

Komodo CD es un pequeño panel de despliegue continuo sobre [Komodo](https://komo.do). Muestra los stacks de una instancia de Komodo con su estado, te deja hacer Pull o Redeploy a mano, registra cada acción y expone esas mismas acciones como un único endpoint HTTP para tu CI. Se distribuye como dos imágenes de Docker, backend y frontend, y guarda sus datos en un fichero SQLite.

## Requisitos

- Un host Linux con Docker y el plugin de Compose (`docker compose`).
- `curl` y `openssl`, que el instalador usa para descargar ficheros y generar el secreto.
- Una instancia de Komodo en marcha a la que ese host llegue por HTTPS, y permiso para crear una API key en ella.

## Instalar con un solo comando

Crea un directorio vacío para el despliegue, entra en él y ejecuta:

```bash
mkdir komodo-cd && cd komodo-cd
curl -fsSL https://raw.githubusercontent.com/Nonetss/Komodo-CD/main/scripts/bootstrap.sh | bash
```

El script es interactivo aunque se ejecute con una tubería, porque lee las respuestas del terminal. Pregunta:

1. El **puerto del host** que se publica (por defecto `80`).
2. La **URL pública** que usarán el navegador y tu CI, por ejemplo `https://deploy.example.com`, sin barra final.
3. El **primer administrador**: nombre, email y una contraseña de al menos 8 caracteres.

Después genera `BETTER_AUTH_SECRET` con `openssl`, descarga `compose.yml`, escribe `.env` (modo `600`) en el directorio actual y se ofrece a descargar las imágenes de `ghcr.io` y arrancar el stack. Nunca sobrescribe un `.env` existente: bórralo antes si quieres empezar de cero.

Con `KCD_REF` en el lado de `bash` (`… | KCD_REF=v1.0.0 bash`) eliges qué versión de `compose.yml` descarga (por defecto `main`).

## Iniciar sesión

El backend aplica las migraciones de la base de datos y crea el administrador de `.env` al arrancar, así que no hay un paso de configuración aparte. A los pocos segundos, abre la URL pública e inicia sesión con el email y la contraseña que elegiste.

## Siguientes pasos

- [Conectar Komodo](./first-run/): añade tu instancia y lanza un primer deploy desde el panel.
- [Desplegar desde CI](./ci/): crea una API key y llama al endpoint de deploy desde GitHub o Gitea Actions.
- [Desplegar con Docker Compose](./deploy/): la misma instalación a mano, detrás de HTTPS.
