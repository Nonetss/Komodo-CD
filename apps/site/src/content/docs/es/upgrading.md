---
title: Actualizaciones y copias
description: Pasar a una versión nueva, hacer y restaurar copias de la base de datos, y los comandos de Compose del día a día.
order: 8
---

## Actualizar

Desde el directorio con `compose.yml` y `.env`:

```bash
docker compose pull
docker compose up -d
```

El backend aplica las migraciones nuevas de la base de datos al arrancar, así que no hay ningún paso más. Si fijaste una versión, cambia antes las dos etiquetas de imagen en `compose.yml` a la nueva. Las versiones y sus notas están en la [página de releases](https://github.com/Nonetss/Komodo-CD/releases).

Haz una copia de la base de datos antes de un salto de versión mayor.

## Qué copiar

Todo lo que guarda Komodo CD está en un único fichero SQLite, `/data/db.sqlite`, en el volumen `db_data`: usuarios, API keys, la conexión con Komodo, los ajustes de ntfy y el historial. Guarda también una copia de `.env`, que tiene `BETTER_AUTH_SECRET` y los datos del administrador.

Los datos sobreviven a reinicios, a `docker compose down` y a las actualizaciones de imagen. **`docker compose down -v` borra el volumen** y con él cada usuario, key y ajuste.

## Hacer una copia

Para el backend para que el fichero no se escriba mientras se copia, archiva el volumen y vuelve a arrancarlo:

```bash
docker compose stop backend
docker run --rm \
  --volumes-from "$(docker compose ps -aq backend)" \
  -v "$PWD":/backup \
  alpine tar czf /backup/db-backup.tar.gz -C /data .
docker compose start backend
```

`--volumes-from` monta el volumen del backend se llame como se llame (Compose le pone delante el nombre del proyecto, normalmente el del directorio).

## Restaurar

```bash
docker compose stop backend
docker run --rm \
  --volumes-from "$(docker compose ps -aq backend)" \
  -v "$PWD":/backup \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/db-backup.tar.gz -C /data"
docker compose start backend
```

## Comandos útiles

```bash
# Seguir los logs de los dos servicios
docker compose logs -f

# Solo el backend
docker compose logs -f backend

# Reiniciar un servicio
docker compose restart backend

# Parar todo (los datos se conservan)
docker compose down
```
