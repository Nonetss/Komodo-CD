#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# scripts/setup-dev.sh — `bun run setup:dev`
#
# Escribe el `.env` de la raíz (el único que leen el backend, el frontend, la
# CLI de Drizzle y compose) a partir de `.env.example`, con un secreto de
# Better Auth y una contraseña de admin generados con openssl y la URL de
# desarrollo. Un `.env` existente se conserva salvo con --force.
#
# Los despliegues tienen su propio `.env`, que escribe scripts/bootstrap.sh en
# el directorio del despliegue, no en este checkout.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

force=0
for arg in "$@"; do
  case "$arg" in
    --force | -f) force=1 ;;
    -h | --help)
      echo "usage: $0 [--force]"
      echo "  --force, -f   overwrite an existing .env"
      exit 0
      ;;
    *)
      echo "unknown flag: $arg" >&2
      exit 2
      ;;
  esac
done

if ! command -v openssl >/dev/null 2>&1; then
  echo "error: openssl is required to generate secrets" >&2
  exit 1
fi

EXAMPLE="$REPO_ROOT/.env.example"
ENV_FILE="$REPO_ROOT/.env"

# Restos de cuando cada app tenía su .env: ya nadie los lee, y Bun cargaría
# apps/backend/.env por encima del de la raíz. Se avisa, nunca se borran.
stale=()
for file in "$REPO_ROOT"/apps/*/.env; do
  [[ -f "$file" ]] && stale+=("${file#"$REPO_ROOT/"}")
done
if ((${#stale[@]})); then
  echo "⚠ Found per-app env files that are no longer read:"
  printf "    %s\n" "${stale[@]}"
  echo "  Move any values you still need into .env, then delete them."
  echo ""
fi

existed=0
[[ -f "$ENV_FILE" ]] && existed=1
if ((existed && !force)); then
  echo "  ↳ .env already exists, skipping (use --force to overwrite)"
  exit 0
fi

APP_URL="http://localhost:4321"
BETTER_AUTH_SECRET="$(openssl rand -base64 32 | tr -d '\n')"
# Tiene que pasar z.email(): "admin@localhost" no tiene TLD
SEED_ADMIN_EMAIL="admin@komodo-cd.local"
SEED_ADMIN_PASSWORD="$(openssl rand -base64 18 | tr -d '\n')"

# Copia .env.example fijando cada variable en su línea `KEY=` o `# KEY=`. Los
# valores van por el entorno para que awk nunca los interprete. umask 077: el
# fichero lleva secretos y se crea con modo 600.
umask 077
APP_URL="$APP_URL" BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" \
  SEED_ADMIN_EMAIL="$SEED_ADMIN_EMAIL" SEED_ADMIN_PASSWORD="$SEED_ADMIN_PASSWORD" \
  awk '
    BEGIN {
      split("APP_URL BETTER_AUTH_SECRET SEED_ADMIN_EMAIL SEED_ADMIN_PASSWORD", keys, " ")
      for (i in keys) wanted[keys[i]] = 1
    }
    {
      line = $0
      sub(/^# /, "", line)
      key = line
      sub(/=.*/, "", key)
      if (line ~ /^[A-Z][A-Z0-9_]*=/ && (key in wanted)) {
        print key "=" ENVIRON[key]
        next
      }
      print
    }
  ' "$EXAMPLE" > "$ENV_FILE"
chmod 600 "$ENV_FILE"

if ((existed)); then
  echo "  ↻ .env overwritten"
else
  echo "  ✓ .env created"
fi

echo ""
echo "✓ Done. Next:"
echo "  bun install"
echo "  bun run dev   # Docker dev stack on $APP_URL (or dev:local without Docker)"
echo "  # the backend applies migrations and seeds the admin on boot"
echo ""
echo "  Admin credentials (created on first backend boot, idempotent):"
printf "    email:    %s\n" "$SEED_ADMIN_EMAIL"
printf "    password: %s\n" "$SEED_ADMIN_PASSWORD"
echo ""
echo "  ⚠ Save the password now — it is not stored anywhere else."
