#!/usr/bin/env bash
# Bump semver in VERSION + package.json.
# - main branch: minor bump, patch reset  (0.1.3 -> 0.2.0)
# - other branches: patch bump           (0.1.0 -> 0.1.1)
set -euo pipefail

VERSION_FILE="${1:?VERSION file path required}"
PACKAGE_JSON="${2:?package.json path required}"
IS_MAIN="${3:-false}"

current="$(tr -d '[:space:]' < "$VERSION_FILE")"
IFS='.' read -r major minor patch <<< "$current"
major="${major:-0}"
minor="${minor:-1}"
patch="${patch:-0}"

if [[ "$IS_MAIN" == "true" ]]; then
  minor=$((minor + 1))
  patch=0
else
  patch=$((patch + 1))
fi

new_version="${major}.${minor}.${patch}"
echo "$new_version" > "$VERSION_FILE"

node <<EOF
const fs = require('fs');
const path = '${PACKAGE_JSON}';
const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
pkg.version = '${new_version}';
fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
EOF

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  echo "version=${new_version}" >> "$GITHUB_OUTPUT"
fi
echo "Bumped ${VERSION_FILE} to ${new_version}"
