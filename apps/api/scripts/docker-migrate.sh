#!/bin/sh
# Compose one-shot: ensure deps, then stamp + migrate.
set -eu
api_dir=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
workspace_root=$(CDPATH= cd -- "$api_dir/../.." && pwd)
workspace_modules="$workspace_root/node_modules"
workspace_lock="$workspace_root/package-lock.json"
install_stamp="$workspace_modules/.videoq-package-lock"

if [ ! -x "$workspace_modules/.bin/drizzle-kit" ] || [ ! -f "$install_stamp" ] \
  || ! cmp -s "$workspace_lock" "$install_stamp" 2>/dev/null; then
  echo "Installing API workspace dependencies for migrate (npm ci)..."
  (cd "$workspace_root" && npm ci --workspace @videoq/api)
  cp "$workspace_lock" "$install_stamp"
fi

cd "$api_dir"
exec npm run db:migrate
