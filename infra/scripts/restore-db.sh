#!/usr/bin/env bash
# Restaura un dump generado por backup-db.sh contra DATABASE_URL.
# ADVERTENCIA: sobrescribe los datos existentes en la base destino (--clean).
# Uso: DATABASE_URL=postgresql://... ./infra/scripts/restore-db.sh <archivo.dump>
set -euo pipefail

cd "$(dirname "$0")/../.."

: "${DATABASE_URL:?Define DATABASE_URL antes de ejecutar este script}"

DUMP_FILE="${1:?Uso: restore-db.sh <archivo.dump>}"

if [ ! -f "$DUMP_FILE" ]; then
  echo "No existe el archivo: $DUMP_FILE" >&2
  exit 1
fi

read -r -p "Esto SOBRESCRIBIRÁ los datos en la base destino. ¿Continuar? [y/N] " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Cancelado."
  exit 1
fi

pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" "$DUMP_FILE"
echo "Restauración completa."
