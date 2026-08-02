#!/usr/bin/env bash
# Prueba de carga smoke (035 §7) vía autocannon (sin instalación previa, corre
# por npx). Pensada para correr contra un entorno de staging/dev, nunca contra
# producción sin coordinarlo primero.
# Uso: ./infra/scripts/load-test.sh [url] [duracion-segundos] [conexiones]
set -euo pipefail

URL="${1:-http://localhost:4000/health}"
DURATION="${2:-20}"
CONNECTIONS="${3:-50}"

npx --yes autocannon --connections "$CONNECTIONS" --duration "$DURATION" "$URL"
