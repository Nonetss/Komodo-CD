// Salidas reales de `trivy image --server … --image-src remote` (Trivy 0.75)

/** Informe JSON recortado de `alpine:3.19`, más un resultado npm de ejemplo. */
export const trivyReportJson = await Bun.file(
  new URL("./trivy-report.json", import.meta.url)
).text()

/** Repo privado (o inexistente) en GHCR: el registry contesta DENIED. */
export const unauthorizedStderr = `2026-10-09T15:35:19Z\tFATAL\tFatal error\trun error: image scan error: scan error: unable to initialize a scan service: unable to initialize container image: unable to find the specified image "ghcr.io/acme/private:1.0" in ["remote"]: 1 error occurred:
\t* remote error: GET https://ghcr.io/token?scope=repository%3Aacme%2Fprivate%3Apull&service=ghcr.io: DENIED: requested access to the resource is denied


`

/** Tag que no existe en Docker Hub. */
export const notFoundStderr = `2026-10-09T15:35:20Z\tFATAL\tFatal error\trun error: image scan error: scan error: unable to initialize a scan service: unable to initialize container image: unable to find the specified image "nginx:nope" in ["remote"]: 1 error occurred:
\t* remote error: GET https://index.docker.io/v2/library/nginx/manifests/nope: MANIFEST_UNKNOWN: manifest unknown; unknown tag=nope


`

/** El servidor de Trivy no contesta. */
export const unavailableStderr = `2026-10-09T15:37:37Z\tFATAL\tFatal error\trun error: image scan error: scan error: scan failed: failed analysis: unable to get missing layers: unable to fetch missing layers: backoff: permanent error (last error: twirp error internal: failed to do request: Post "http://trivy:4954/twirp/trivy.cache.v1.Cache/MissingBlobs": dial tcp 10.0.0.9:4954: connect: connection timed out)
`
