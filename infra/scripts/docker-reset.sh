#!/usr/bin/env bash
# Detiene el stack de Docker Compose, elimina los volúmenes de datos y
# reconstruye todas las imágenes desde cero. Uso: ./infra/scripts/docker-reset.sh
set -euo pipefail

cd "$(dirname "$0")/../.."

docker compose down --volumes
docker compose build --no-cache
docker compose up
