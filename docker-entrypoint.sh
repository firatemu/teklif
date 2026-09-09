#!/bin/sh
set -e

mkdir -p /app/data

# First boot: seed empty DB from migrated template if missing
if [ ! -f /app/data/dev.db ]; then
  if [ -f /app/prisma/template.db ]; then
    echo "[entrypoint] Initializing SQLite from template..."
    cp /app/prisma/template.db /app/data/dev.db
  else
    echo "[entrypoint] No template DB; running prisma migrate deploy..."
    ./node_modules/.bin/prisma migrate deploy --schema=/app/prisma/schema.prisma || true
  fi
fi

echo "[entrypoint] Starting AzemTeklif on :${PORT:-3000}"
exec "$@"
