#!/usr/bin/env bash
# Deploy/update Sensi on an Ubuntu server. Run from the repo root.
# First run: installs deps, builds, starts under pm2.
# Later runs: pulls latest, reinstalls, rebuilds, restarts pm2.
set -euo pipefail

APP_NAME="sensi"

if [ ! -f .env ]; then
  echo "Missing .env — copy deploy/.env.example to .env and fill in real values first." >&2
  exit 1
fi

git pull
pnpm install --frozen-lockfile
pnpm db:push
pnpm build

if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 restart "$APP_NAME"
else
  pm2 start dist/index.js --name "$APP_NAME"
  pm2 save
fi

echo "Deployed. pm2 status:"
pm2 status "$APP_NAME"
