#!/usr/bin/env bash
# Genera un dump comprimido de Postgres (pg_dump -Fc, formato custom — permite
# restauración selectiva por tabla) a partir de DATABASE_URL. Uso:
#   DATABASE_URL=postgresql://... ./infra/scripts/backup-db.sh [directorio-destino]
#
# IMPORTANTE: la versión de pg_dump debe ser IGUAL o MAYOR que la del servidor
# (pg_dump no soporta versiones de servidor más nuevas que el propio cliente).
# Verificado en este proyecto: Railway sirve Postgres 18, pero Homebrew instala
# postgresql@14 por defecto en macOS — con ese cliente el backup falla con
# "server version mismatch". Instalar el cliente correcto (`brew install
# postgresql@18`) o correr este script dentro de un contenedor con la versión
# del servidor.
set -euo pipefail

cd "$(dirname "$0")/../.."

: "${DATABASE_URL:?Define DATABASE_URL antes de ejecutar este script (ver apps/api/.env)}"

OUTPUT_DIR="${1:-backups}"
mkdir -p "$OUTPUT_DIR"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUTPUT_FILE="$OUTPUT_DIR/mijersey-$TIMESTAMP.dump"

echo "Generando backup en $OUTPUT_FILE..."
pg_dump --format=custom --file="$OUTPUT_FILE" "$DATABASE_URL"
echo "Backup completo ($(du -h "$OUTPUT_FILE" | cut -f1))."
