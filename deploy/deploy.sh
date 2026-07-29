#!/usr/bin/env bash
# Deploy/update Sensi on an Ubuntu server. Run from the repo root.
# First run: also do the one-time systemd setup below (see deploy/sensi.service).
# Every run: pulls latest, reinstalls, rebuilds, restarts the systemd service.
set -euo pipefail

SERVICE_NAME="sensi"

if [ ! -f .env ]; then
  echo "Missing .env — copy deploy/.env.example to .env and fill in real values first." >&2
  exit 1
fi

git pull
pnpm install --frozen-lockfile
pnpm db:push
pnpm build

sudo systemctl restart "$SERVICE_NAME"

echo "Deployed. Service status:"
sudo systemctl status "$SERVICE_NAME" --no-pager
