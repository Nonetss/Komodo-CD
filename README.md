# Komodo CD — Docker

Despliegue en producción de Komodo CD usando imágenes publicadas en GHCR.

| Stacks | Deploy |
|--------|--------|
| ![Stacks](img/stacks.png) | ![Deploy](img/deploy.png) |

| Historial | Credenciales |
|-----------|--------------|
| ![Historial](img/historial.png) | ![Credenciales](img/credenciales.png) |

## Requisitos

- Docker + Docker Compose v2
- Acceso a internet para hacer pull de las imágenes

## Inicio rápido

### 1. Generar los secretos

```bash
# Secreto de Better Auth (requerido)
openssl rand -base64 32

# Contraseña del admin inicial (requerido)
openssl rand -base64 16
```

### 2. Configurar el entorno

```bash
cp .env.example .env
```

Edita `.env` y rellena al menos estas tres variables:

```env
APP_URL=https://tu-dominio.com
BETTER_AUTH_SECRET=<salida del primer openssl>
SEED_ADMIN_PASSWORD=<salida del segundo openssl>
```

### 3. Arrancar

```bash
docker compose up -d
```

La app quedará disponible en el puerto configurado en `PORT` (por defecto `80`).

---

## compose.yml

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
      SSO_CLIENT_ID: "${SSO_CLIENT_ID:-}"
      SSO_CLIENT_SECRET: "${SSO_CLIENT_SECRET:-}"
      SSO_ISSUER: "${SSO_ISSUER:-}"
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

---

## Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `APP_URL` | ✅ | URL pública de la app, sin trailing slash |
| `BETTER_AUTH_SECRET` | ✅ | Secreto para firmar sesiones. `openssl rand -base64 32` |
| `SEED_ADMIN_PASSWORD` | ✅ | Contraseña del usuario admin que se crea al arrancar |
| `PORT` | — | Puerto expuesto en el host. Por defecto `80` |
| `SEED_ADMIN_EMAIL` | — | Email del admin. Por defecto `admin@example.com` |
| `SEED_ADMIN_NAME` | — | Nombre del admin. Por defecto `Admin` |
| `SSO_CLIENT_ID` | — | Client ID de Keycloak para SSO |
| `SSO_CLIENT_SECRET` | — | Client Secret de Keycloak |
| `SSO_ISSUER` | — | Discovery URL del realm de Keycloak |

## Actualizar a la última versión

```bash
docker compose pull
docker compose up -d
```

## Comandos útiles

```bash
# Ver logs en tiempo real
docker compose logs -f

# Ver logs solo del backend
docker compose logs -f backend

# Reiniciar un servicio
docker compose restart backend

# Parar todo
docker compose down

# Parar y eliminar el volumen de la BD (⚠️ borra todos los datos)
docker compose down -v
```

## Datos persistentes

La base de datos SQLite se guarda en el volumen Docker `db_data`, montado en `/data` dentro del contenedor backend. Los datos sobreviven reinicios y actualizaciones de imagen.

Para hacer un backup manual:

```bash
docker run --rm \
  -v komodo_db_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/db-backup.tar.gz -C /data .
```

Para restaurar:

```bash
docker run --rm \
  -v komodo_db_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/db-backup.tar.gz -C /data
```
