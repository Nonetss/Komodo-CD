#!/usr/bin/env bash
# Atajo al instalador (scripts/bootstrap.sh): lo ejecuta desde el repo
# clonado o, con `curl | bash`, lo descarga de GitHub.
set -Eeuo pipefail

KCD_REF="${KCD_REF:-main}"
export KCD_REF

# Desde un repo clonado: usa el script local. Con `curl | bash` no hay
# BASH_SOURCE en disco, así que se descarga.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]:-.}")" 2>/dev/null && pwd -P || true)"
if [[ -n "$script_dir" && -f "$script_dir/bootstrap.sh" ]]; then
  exec bash "$script_dir/bootstrap.sh"
fi

exec bash <(curl -fsSL "https://raw.githubusercontent.com/Nonetss/Komodo-CD/${KCD_REF}/scripts/bootstrap.sh")
