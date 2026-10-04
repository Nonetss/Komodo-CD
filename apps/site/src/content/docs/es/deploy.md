---
title: Desplegar con Docker Compose
description: Monta Komodo CD a mano, ponlo detrás de HTTPS, fija una versión o construye las imágenes desde el código.
order: 4
---

El [instalador de una línea](../) hace todo esto por ti. Esta página es la misma instalación paso a paso, más lo que hay que cambiar para HTTPS y versiones fijas.

## 1. Descarga el fichero de Compose

```bash
mkdir komodo-cd && cd komodo-cd
curl -fsSLO https://raw.githubusercontent.com/Nonetss/Komodo-CD/main/compose.yml
curl -fsSL https://raw.githubusercontent.com/Nonetss/Komodo-CD/main/.env.example -o .env
```

## 2. Genera los secretos

```bash
# Secreto de Better Auth (obligatorio)
openssl rand -base64 32

# Contraseña del administrador inicial (obligatoria)
openssl rand -base64 16
```

## 3. Rellena `.env`

Como mínimo estas tres variables:

```dotenv
APP_URL=https://deploy.example.com
BETTER_AUTH_SECRET=<salida del primer comando>
SEED_ADMIN_PASSWORD=<salida del segundo comando>
```

`APP_URL` es la URL que usarán el navegador y tu CI, sin barra final. Todas las variables están en [Configuración](../configuration/).

## 4. Arranca

```bash
docker compose up -d
```

La app responde en el puerto de `PORT` (por defecto `80`). En el primer arranque el backend crea la base de datos SQLite en el volumen `db_data`, aplica las migraciones y crea el administrador.

## El fichero de Compose

```yaml
services:
  backend:
    image: ghcr.io/nonetss/komodo-cd-backend:latest
    restart: unless-stopped
    volumes:
      - db_data:/data
    environment:
      DATABASE_URL: "file:/data/db.sqlite"
      BETTER_AUTH_URL: "${APP_URL:?APP_URL is required}"
      BETTER_AUTH_SECRET: "${BETTER_AUTH_SECRET:?BETTER_AUTH_SECRET is required}"
      SEED_ADMIN_EMAIL: "${SEED_ADMIN_EMAIL:-admin@example.com}"
      SEED_ADMIN_NAME: "${SEED_ADMIN_NAME:-Admin}"
      SEED_ADMIN_PASSWORD: "${SEED_ADMIN_PASSWORD:?SEED_ADMIN_PASSWORD is required}"
    networks:
      - komodo_net

  frontend:
    image: ghcr.io/nonetss/komodo-cd-frontend:latest
    restart: unless-stopped
    environment:
      BACKEND_URL: "http://backend:3000"
    ports:
      - "${PORT:-80}:80"
    depends_on:
      - backend
    networks:
      - komodo_net

networks:
  komodo_net:

volumes:
  db_data:
```

Solo el frontend publica un puerto. Su Caddy manda la API a `backend:3000` por la red de Compose, así que el backend nunca necesita exponerse.

## Detrás de HTTPS

El Caddy de la imagen del frontend sirve HTTP plano en el puerto 80 y no pide certificados. Termina TLS delante con el proxy inverso que ya uses y pon en `APP_URL` la URL `https://`: Better Auth la usa como origen de confianza, así que el inicio de sesión falla si no coincide con la dirección del navegador.

Por ejemplo, publica Komodo CD en un puerto local y deja que un Caddy en el host se encargue del certificado:

```dotenv
PORT=8080
APP_URL=https://deploy.example.com
```

```text
deploy.example.com {
    reverse_proxy localhost:8080
}
```

## Fijar una versión

Las imágenes se publican como `latest` (la rama `main`) y con la versión de cada release (`1.0.0`, `1.0`). Para quedarte en una, cambia las etiquetas en `compose.yml`:

```yaml
image: ghcr.io/nonetss/komodo-cd-backend:1.0.0
# …
image: ghcr.io/nonetss/komodo-cd-frontend:1.0.0
```

Mantén las dos imágenes en la misma versión.

## Construir las imágenes desde el código

Desde un clon del repositorio, `compose.build.yml` extiende los mismos servicios pero construye las imágenes desde el monorepo:

```bash
git clone https://github.com/Nonetss/Komodo-CD.git
cd Komodo-CD
cp .env.example .env   # y rellénalo
docker compose -f compose.build.yml up -d --build
```

`bun run docker:up` es un atajo para el mismo comando.
