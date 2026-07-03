#!/bin/bash
set -e

echo "Applying schema..."
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -f /docker-entrypoint-initdb.d/schema.sql

for f in $(ls /docker-entrypoint-initdb.d/migrations/*.sql 2>/dev/null | sort); do
  filename=$(basename "$f")
  echo "Applying migration: $filename"
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$f"
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    -c "INSERT INTO schema_migrations (filename) VALUES ('$filename') ON CONFLICT DO NOTHING;"
done

echo "Database ready."
