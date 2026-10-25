#!/bin/sh
set -e

mkdir -p /app/data

# First boot: seed empty DB from migrated template if missing
if [ ! -f /app/data/dev.db ]; then
  if [ -f /app/prisma/template.db ]; then
    echo "[entrypoint] Initializing SQLite from template..."
    cp /app/prisma/template.db /app/data/dev.db
  fi
fi

# Apply pending schema migrations to the persisted database.
# The standalone runner image has no node_modules/.bin symlinks, so the CLI is
# invoked through its package entry point.
if [ -f /app/prisma/schema.prisma ] && [ -f /app/node_modules/prisma/build/index.js ]; then
  echo "[entrypoint] Applying pending migrations..."
  node /app/node_modules/prisma/build/index.js migrate deploy --schema=/app/prisma/schema.prisma || \
    echo "[entrypoint] WARNING: migrate deploy did not complete"
fi

echo "[entrypoint] Starting AzemTeklif on :${PORT:-3000}"
exec "$@"
