#!/usr/bin/env sh
# Stop tracking node_modules and .next so they are no longer pushed.
# Run from repo root (monorepo) or from fuelflow-web (single repo).
set -e
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
if [ -d "fuelflow-web/node_modules" ] || [ -d "fuelflow-web/.next" ]; then
  git rm -r --cached fuelflow-web/node_modules 2>/dev/null || true
  git rm -r --cached fuelflow-web/.next 2>/dev/null || true
  git rm -r --cached fuelflow-web/out 2>/dev/null || true
else
  git rm -r --cached node_modules 2>/dev/null || true
  git rm -r --cached .next 2>/dev/null || true
  git rm -r --cached out 2>/dev/null || true
fi
echo "Done. Commit with: git add . && git commit -m 'Stop tracking node_modules and .next'"
