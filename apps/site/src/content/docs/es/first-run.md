---
title: Conectar Komodo
description: Apunta Komodo CD a tu instancia de Komodo, revisa el estado de tus stacks y lanza un primer deploy a mano.
order: 2
---

Una instalación nueva aún no tiene conexión con Komodo, así que la lista de stacks está vacía. Esta guía la conecta y lanza una primera acción.

## 1. Crea una key en Komodo

Komodo CD habla con la API de Komodo Core con una API key y un secret.

1. Abre tu instancia de Komodo.
2. Ve a **Settings → API Keys**.
3. Crea una key nueva y copia tanto la **key** como el **secret**.

Una API key de Komodo actúa como el usuario que la creó, y Komodo CD ejecuta con ella los propios `PullStack` y `DeployStack` de Komodo, así que créala con un usuario que pueda ver y desplegar esos stacks.

## 2. Añade la conexión

En Komodo CD, abre **Conexión** (`/credentials`) y rellena un nombre, la URL de la instancia (por ejemplo `https://komodo.example.com`), la key y el secret. Komodo CD guarda una sola conexión: guardar de nuevo la sustituye.

La key y el secret se guardan en la base de datos del backend y solo se usan para llamar a Komodo. La API muestra la conexión por nombre y URL y nunca devuelve las credenciales.

Una vez guardada, la página muestra el estado de la conexión y cuántos stacks ve.

## 3. Revisa tus stacks

El **Resumen** (`/`, donde aterrizas al iniciar sesión) reúne las cifras de la instancia en tres bloques:

- **Stacks**: cuántos están en marcha, con problemas o parados, los servicios con imagen nueva y los stacks con un commit nuevo, y qué stacks piden atención (un estado de error o desconocido, un proyecto que falta en el host o ficheros que no están) o tienen algo nuevo que desplegar.
- **Seguridad**: cuántas imágenes hay escaneadas, cuáles tienen vulnerabilidades críticas, las CVEs por severidad y las imágenes más expuestas (ver la página de Seguridad).
- **Despliegues**: los deploys y pulls de los últimos 30 días, día a día, con el porcentaje de éxito, cuántos se lanzaron desde CI, los stacks más desplegados y los últimos fallos.

Debajo van los stacks **En marcha** y **Parados**.

**Stacks** (`/stacks`) es la lista completa, con búsqueda y los filtros **Running** (en marcha o desplegándose), **Parados** (parados, caídos, en pausa o creados) y **Problemas**. Pulsa un stack para abrir su página en `/stacks/<nombre>`: sus servicios e imágenes, cuáles tienen imagen nueva, el commit desplegado y el último, y el curl que lanza cada acción desde CI.

## 4. Lanza una acción

La página de un stack tiene tres botones, y **Deploy** (`/deploy`) hace lo mismo desde un formulario donde eliges el stack:

| Acción | Qué hace Komodo |
| --- | --- |
| **Pull** | Descarga las imágenes del stack sin reiniciarlo (`PullStack`). |
| **Redeploy** | Baja y vuelve a levantar todo el stack (`DeployStack`). |
| **Pull + Redeploy** | Las dos, en ese orden. Lo habitual después de publicar una imagen nueva. |

Para lanzar una acción en varios stacks, márcalos en la lista de **Stacks** y elígela en la barra que aparece; Komodo CD lanza como mucho tres a la vez y avisa del resultado en un solo mensaje.

## 5. Consulta el historial

Cada acción, desde el panel o desde CI, acaba en **Historial** (`/history`): el stack, la acción, quién la lanzó, si funcionó y el mensaje de Komodo. La página muestra las últimas 100 acciones y las filtra por correctas y fallidas.

## 6. Entérate cuando falle un deploy

Opcionalmente, la página de **Conexión** admite también un destino de [ntfy](https://ntfy.sh): un servidor (ntfy.sh o el tuyo), un topic y, para topics protegidos, un access token. Cada vez que falla un deploy, desde CI o a mano, Komodo CD publica un aviso en ese topic con el stack, la acción, quién la lanzó y el error de Komodo. **Enviar prueba** comprueba la configuración antes de fiarte de ella, y los avisos se pueden pausar sin borrarlos.

En ntfy.sh un topic funciona como una contraseña: elige uno difícil de adivinar o protégelo con un token.
