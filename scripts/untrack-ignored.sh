#!/usr/bin/env sh
# Stop tracking node_modules and .next so they are no longer pushed.
# Run from repo root (monorepo) or from stationiq-web (single repo).
set -e
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
if [ -d "stationiq-web/node_modules" ] || [ -d "stationiq-web/.next" ]; then
  git rm -r --cached stationiq-web/node_modules 2>/dev/null || true
  git rm -r --cached stationiq-web/.next 2>/dev/null || true
  git rm -r --cached stationiq-web/out 2>/dev/null || true
else
  git rm -r --cached node_modules 2>/dev/null || true
  git rm -r --cached .next 2>/dev/null || true
  git rm -r --cached out 2>/dev/null || true
fi
echo "Done. Commit with: git add . && git commit -m 'Stop tracking node_modules and .next'"
