#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# KOMODO CD — bootstrap
#
# Generates a `.env` file with a random Better Auth secret (openssl), prompts
# for the public URL, host port and initial admin credentials, and optionally
# starts the stack with docker compose (compose.yml, images from GHCR).
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/Nonetss/Komodo-CD/main/scripts/bootstrap.sh | bash
#
# Requirements: docker (with compose v2), openssl, curl.
#
# Can be run standalone (curl | bash) or from a cloned repo. In both cases it
# writes `.env` (and downloads compose.yml if missing) in the CURRENT
# DIRECTORY.
# ─────────────────────────────────────────────────────────────────────────────

set -Eeuo pipefail

# The stack is generated/started in the directory where you run the script,
# not where the script file lives. Works the same via `curl | bash` or cloned.
TARGET_DIR="$(pwd -P)"

# Tag/branch used to download compose.yml. Override: KCD_REF=v1.0.0 ...
KCD_REF="${KCD_REF:-main}"
RAW_BASE="https://raw.githubusercontent.com/Nonetss/Komodo-CD/${KCD_REF}"

# ── Output helpers ───────────────────────────────────────────────────────────
if [[ -t 1 ]]; then
  C_RESET=$'\033[0m'; C_CYAN=$'\033[1;36m'; C_GREEN=$'\033[1;32m'; C_RED=$'\033[1;31m'; C_DIM=$'\033[2m'
else
  C_RESET=""; C_CYAN=""; C_GREEN=""; C_RED=""; C_DIM=""
fi
log()  { printf '%s==>%s %s\n' "$C_CYAN"  "$C_RESET" "$*"; }
ok()   { printf '%s[OK]%s %s\n' "$C_GREEN" "$C_RESET" "$*"; }
err()  { printf '%s[ERROR]%s %s\n' "$C_RED"  "$C_RESET" "$*" >&2; }
note() { printf '%s%s%s\n'     "$C_DIM"   "$*" "$C_RESET"; }

# ── Dependency check ─────────────────────────────────────────────────────────
for cmd in docker openssl curl; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    err "Missing required command: $cmd"
    exit 1
  fi
done

if ! docker compose version >/dev/null 2>&1; then
  err "Docker Compose v2 is required (docker compose)"
  exit 1
fi

# This script is interactive (asks for admin/password). With `curl | bash`, stdin
# is the script itself, so we read from the real terminal (/dev/tty).
if [[ ! -r /dev/tty ]]; then
  err "No interactive terminal (/dev/tty). Run this script from a shell."
  exit 1
fi

# ── Banner ───────────────────────────────────────────────────────────────────
printf '%s' "$C_CYAN"
cat <<'BANNER'

  ██╗  ██╗ ██████╗ ███╗   ███╗ ██████╗ ██████╗  ██████╗      ██████╗██████╗
  ██║ ██╔╝██╔═══██╗████╗ ████║██╔═══██╗██╔══██╗██╔═══██╗    ██╔════╝██╔══██╗
  █████╔╝ ██║   ██║██╔████╔██║██║   ██║██║  ██║██║   ██║    ██║     ██║  ██║
  ██╔═██╗ ██║   ██║██║╚██╔╝██║██║   ██║██║  ██║██║   ██║    ██║     ██║  ██║
  ██║  ██╗╚██████╔╝██║ ╚═╝ ██║╚██████╔╝██████╔╝╚██████╔╝    ╚██████╗██████╔╝
  ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝      ╚═════╝╚═════╝

BANNER
printf '%s' "$C_RESET"
printf '  %s────────────────────────────────────────────────────────────%s\n' "$C_CYAN" "$C_RESET"
printf '  %s  Bootstrap · generates .env and starts the stack%s\n' "$C_DIM" "$C_RESET"
printf '  %s────────────────────────────────────────────────────────────%s\n\n' "$C_CYAN" "$C_RESET"
note "This script generates .env with random secrets."
note "If .env already exists, abort (delete it manually and run again)."
echo

# ── Prompt helpers ───────────────────────────────────────────────────────────
prompt() {
  local label="$1" default="${2:-}" value
  if [[ -n "$default" ]]; then
    read -r -p "$(printf '%s [%s]: ' "$label" "$default")" value </dev/tty
    value="${value:-$default}"
  else
    read -r -p "$(printf '%s: ' "$label")" value </dev/tty
  fi
  printf '%s' "$value"
}

prompt_secret() {
  local label="$1" value=""
  while [[ -z "$value" ]]; do
    read -r -s -p "$(printf '%s: ' "$label")" value </dev/tty
    # Newline goes to /dev/tty, not stdout: if it went to stdout, the $(...)
    # wrapping this function would capture it and leak it into the password.
    echo >/dev/tty
    # Extra guard: no CR/LF inside the value.
    value="${value//[$'\r\n']/}"
  done
  printf '%s' "$value"
}

prompt_confirm() {
  local label="$1" default="${2:-y}" yn
  local hint
  if [[ "$default" =~ ^[Yy]$ ]]; then hint="Y/n"; else hint="y/N"; fi
  read -r -p "$(printf '%s [%s]: ' "$label" "$hint")" yn </dev/tty
  yn="${yn:-$default}"
  [[ "$yn" =~ ^[Yy]$ ]]
}

is_email() {
  [[ "$1" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]
}

gen_secret() {
  openssl rand -base64 48 | tr -d '\n'
}

# Docker Compose parses and interpolates .env values. Double quotes with `\`,
# `"` and `$` escaped (`$$` is a literal dollar) round-trip any prompt value
# verbatim: backslashes, quotes, `${VAR}`, a trailing backslash… Single quotes
# do not: Compose keeps `\\` doubled and a trailing `\` breaks the file.
env_quote() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  value="${value//\$/\$\$}"
  printf '"%s"' "$value"
}

download_file() {
  local url="$1" destination="$2" destination_dir temporary_file
  destination_dir="$(dirname "$destination")"
  mkdir -p "$destination_dir"
  temporary_file="$(mktemp "$destination_dir/.bootstrap-download.XXXXXX")"

  if ! curl -fsSL "$url" -o "$temporary_file"; then
    rm -f "$temporary_file"
    return 1
  fi

  # mktemp crea con 600; el compose no tiene secretos
  chmod 644 "$temporary_file"
  mv "$temporary_file" "$destination"
}

# Before any prompt, so nobody answers everything just to be told at the end
# that there is already an installation here.
ENV_FILE="$TARGET_DIR/.env"
if [[ -e "$ENV_FILE" ]]; then
  err "$ENV_FILE already exists — delete it manually if you want to regenerate"
  exit 1
fi

# ── Inputs ───────────────────────────────────────────────────────────────────
log "Configuration — answer the prompts."
echo

# Asked before the public URL so the URL default can follow the chosen port.
# compose.yml publishes "${PORT:-80}:80" (the Caddy gateway).
PORT=$(prompt "Host port to expose the app" "80")
# 10#: "08" is decimal 8, not an invalid octal that aborts under set -e
if ! [[ "$PORT" =~ ^[0-9]{1,5}$ ]] || (( 10#$PORT < 1 || 10#$PORT > 65535 )); then
  err "Invalid port"
  exit 1
fi
PORT=$((10#$PORT))

if [[ "$PORT" == "80" ]]; then
  DEFAULT_URL="http://localhost"
else
  DEFAULT_URL="http://localhost:$PORT"
fi

# Better Auth uses it for CORS/trusted origins; it also appears in the curl
# snippets. Without a trailing slash.
APP_URL=$(prompt "Public URL (what the browser and CI will use)" "$DEFAULT_URL")
APP_URL="${APP_URL%/}"
if [[ ! "$APP_URL" =~ ^https?:// ]]; then
  err "Invalid URL (must start with http:// or https://)"
  exit 1
fi
if [[ "$APP_URL" =~ ^http://([^/:]+) ]] \
  && [[ ! "${BASH_REMATCH[1]}" =~ ^(localhost|127\.0\.0\.1)$ ]]; then
  note "Plain http:// on a public host: passwords and sessions travel unencrypted."
  note "Put a TLS proxy in front and use the https:// URL here (see the deploy guide)."
fi

ADMIN_NAME=$(prompt "Admin name" "Admin")
[[ -n "$ADMIN_NAME" ]] || { err "Name cannot be empty"; exit 1; }

ADMIN_EMAIL=""
until is_email "$ADMIN_EMAIL"; do
  ADMIN_EMAIL=$(prompt "Admin email" "admin@example.com")
  is_email "$ADMIN_EMAIL" || err "Invalid email, try again"
done

ADMIN_PASSWORD=""
until [[ ${#ADMIN_PASSWORD} -ge 8 ]]; do
  ADMIN_PASSWORD=$(prompt_secret "Admin password (min 8 characters)")
  if [[ ${#ADMIN_PASSWORD} -lt 8 ]]; then
    err "Too short, minimum 8 characters"
  fi
done
printf '\n'

# ── Summary ──────────────────────────────────────────────────────────────────
echo
log "Configuration summary:"
echo "  Public URL:        $APP_URL"
echo "  Host port:         $PORT"
echo "  Admin:             $ADMIN_NAME <$ADMIN_EMAIL>"
echo

if ! prompt_confirm "Generate .env and continue?"; then
  note "Aborted. Nothing was written."
  exit 0
fi

# ── Generate secrets ─────────────────────────────────────────────────────────
log "Generating secrets with openssl..."
BETTER_AUTH_SECRET=$(gen_secret)
ok "Secrets generated (BETTER_AUTH_SECRET)"

# ── Download compose file ────────────────────────────────────────────────────
# Do this before creating .env: a network error must not leave an installation
# that looks complete and refuses to run again because .env already exists.

COMPOSE_FILE="$TARGET_DIR/compose.yml"
if [[ ! -f "$COMPOSE_FILE" ]]; then
  log "Downloading compose.yml ($KCD_REF)..."
  download_file "$RAW_BASE/compose.yml" "$COMPOSE_FILE"
  ok "compose.yml downloaded to $COMPOSE_FILE"
fi

# ── Write .env ───────────────────────────────────────────────────────────────
ENV_FILE_TMP=$(mktemp "$TARGET_DIR/.bootstrap-env.XXXXXX")
trap 'test -z "${ENV_FILE_TMP:-}" || rm -f "$ENV_FILE_TMP"' EXIT
chmod 600 "$ENV_FILE_TMP"

cat > "$ENV_FILE_TMP" <<EOF
# Generated by scripts/bootstrap.sh on $(date -u +%FT%TZ)
# Do not commit — contains secrets.

# ── Public host ──────────────────────────────────────────────────────────────
# Public app URL, without trailing slash. Used for CORS, trusted origins and
# the curl snippets shown in the dashboard.
APP_URL=$(env_quote "$APP_URL")

# Port that the gateway (Caddy) exposes on the host.
PORT=$PORT

# ── Better Auth ──────────────────────────────────────────────────────────────
# Secret used to sign sessions and tokens.
BETTER_AUTH_SECRET=$(env_quote "$BETTER_AUTH_SECRET")

# ── Seed admin ───────────────────────────────────────────────────────────────
# Created on first backend boot (idempotent by email).
SEED_ADMIN_NAME=$(env_quote "$ADMIN_NAME")
SEED_ADMIN_EMAIL=$(env_quote "$ADMIN_EMAIL")
SEED_ADMIN_PASSWORD=$(env_quote "$ADMIN_PASSWORD")
EOF

mv "$ENV_FILE_TMP" "$ENV_FILE"
ENV_FILE_TMP=""
ok ".env written to $ENV_FILE (mode 600)"

# ── Start stack ──────────────────────────────────────────────────────────────
# The backend applies the SQLite migrations and seeds the admin on startup.
echo
if prompt_confirm "Start the stack now with docker compose?"; then
  log "docker compose pull..."
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull

  log "docker compose up -d..."
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

  ok "Done. The backend runs migrations and seeds the admin on startup."
  ok "In a few seconds go to $APP_URL and sign in with $ADMIN_EMAIL"
  note "Next: open Connection to add your Komodo instance, then API Keys"
  note "to create a key for your CI pipelines."
else
  note "When you're ready to start (from this folder):"
  note "  docker compose --env-file .env up -d"
fi
