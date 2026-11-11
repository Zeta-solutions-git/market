#!/usr/bin/env bash
# Build the marketplace from this checkout and (re)start it. See DEPLOY.md.
# The previous container keeps serving while the new image builds; if the
# build fails, nothing is swapped.
set -euo pipefail
cd "$(dirname "$0")"

[ -f .env ] || { echo "No .env found: cp .env.template .env and fill it in (see DEPLOY.md)." >&2; exit 1; }
if grep -q '_FILL_ME_' .env; then
  echo "Warning: .env still contains _FILL_ME_ values:" >&2
  grep -n '_FILL_ME_' .env | cut -d= -f1 >&2
fi

docker compose build
docker compose up -d
docker compose ps
curl -s -o /dev/null -w "ocean-market on 127.0.0.1:8008 -> HTTP %{http_code}\n" --retry 10 --retry-connrefused --retry-delay 3 http://127.0.0.1:8008/ || true
