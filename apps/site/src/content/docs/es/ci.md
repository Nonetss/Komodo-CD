---
title: Desplegar desde CI
description: Crea una API key y lanza un Pull, Redeploy o Pull + Redeploy desde GitHub Actions, Gitea Actions o cualquier script.
order: 3
---

El CI habla con el mismo endpoint que usan los curl del panel: `POST /api/v0/deploy`, autenticado con una API key en la cabecera `x-api-key`.

## Crear una API key

Abre **API Keys** (`/keys`), dale un nombre a la key (el pipeline o repositorio al que va) y créala. La key completa se muestra **una sola vez**: cópiala en los secretos de tu CI en ese momento. Después la lista solo enseña sus primeros caracteres.

Las acciones hechas con una key se registran en el historial como `API Key: <nombre>`, así que con una key por pipeline sabes cuál desplegó qué. Borrar una key la revoca al instante.

## La petición

```bash
curl --fail-with-body -X POST https://deploy.example.com/api/v0/deploy \
  -H "x-api-key: $KOMODO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"stack":"my-stack","action":"pull-redeploy"}'
```

| Campo | Valor |
| --- | --- |
| `stack` | El nombre del stack en Komodo. |
| `action` | `pull`, `redeploy` o `pull-redeploy`. |

La petición vuelve en cuanto Komodo acepta la acción; el despliegue en sí corre en Komodo, donde puedes seguirlo. Si va bien responde `200` con:

```json
{
  "success": true,
  "message": "Acción 'pull-redeploy' completada para 'my-stack'",
  "stack": "my-stack",
  "action": "pull-redeploy"
}
```

Sin key o con una key no válida responde `401`. Si Komodo rechaza la acción (un stack que no existe, una key sin permiso, Komodo inaccesible), la respuesta es `502` con el mensaje de Komodo en `message` (`503` si Komodo CD aún no tiene conexión con Komodo), y el fallo queda en el historial como cualquier otra acción. Con `--fail-with-body` curl sale con error en esos casos, así que el paso del CI también falla.

La página de cada stack en **Stacks** y la página **Deploy** muestran este mismo comando con el stack y la acción ya puestos, listo para copiar.

## GitHub Actions

Un workflow que construye y publica una imagen en GHCR y después redespliega el stack que la ejecuta:

```yaml
name: Build, Publish and Deploy

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v7

      - name: Log in to GHCR
        uses: docker/login-action@v4
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v7
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}:latest

      - name: Pull + Redeploy stack
        run: |
          curl --fail-with-body -X POST ${{ secrets.KOMODO_CD_URL }}/api/v0/deploy \
            -H "x-api-key: ${{ secrets.KOMODO_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"stack":"${{ vars.STACK_NAME }}","action":"pull-redeploy"}'
```

Necesita estos secretos y variables del repositorio:

| Clave | Tipo | Valor |
| --- | --- | --- |
| `KOMODO_CD_URL` | Secret | La URL pública de Komodo CD, por ejemplo `https://deploy.example.com`. |
| `KOMODO_API_KEY` | Secret | La API key creada antes. |
| `STACK_NAME` | Variable | El nombre del stack en Komodo. |

## Fallar con vulnerabilidades

Cada deploy correcto encola un escaneo de [Trivy](https://trivy.dev) de las imágenes del stack, y la misma API key lee los resultados. El escaneo va en segundo plano, así que un pipeline que quiera bloquear según el resultado espera a que ninguna imagen del stack esté `queued` ni `scanning` y después mira los recuentos:

```yaml
      - name: Fallar con vulnerabilidades críticas
        env:
          URL: ${{ secrets.KOMODO_CD_URL }}
          KEY: ${{ secrets.KOMODO_API_KEY }}
          STACK: ${{ vars.STACK_NAME }}
        run: |
          for i in $(seq 1 60); do
            images=$(curl -sf "$URL/api/v0/security/images" -H "x-api-key: $KEY" \
              | jq --arg s "$STACK" '[.images[] | select(.stacks | index($s))]')
            echo "$images" | jq -e 'all(.status != "queued" and .status != "scanning")' > /dev/null && break
            sleep 10
          done
          echo "$images" | jq -e 'map(.counts.critical) | add == 0'
```

Un escaneo que no pudo descargar la imagen (de un registry privado, por ejemplo) termina como `failed` con `errorKind: "unauthorized"` y con los recuentos a cero: decide en el filtro de `jq` si eso debe hacer fallar el job.

## Gitea Actions

Gitea Actions usa la misma sintaxis de workflow: pon el fichero en `.gitea/workflows/` y define los mismos secretos y variables en los ajustes del repositorio. El paso de deploy no cambia.

## Sin CI

El endpoint es HTTP y JSON sin más, así que cualquier cosa que ejecute curl puede desplegar: un cron, un hook de Git o un script en tu portátil.
