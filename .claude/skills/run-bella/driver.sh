#!/usr/bin/env bash
# Smoke-checks the three bella dev servers (api/webapp/admin) that are
# assumed to already be running (see SKILL.md "Run (agent path)").
# Usage: driver.sh [api-port] [webapp-port] [admin-port]
set -uo pipefail

API_PORT="${1:-3000}"
WEBAPP_PORT="${2:-4200}"
ADMIN_PORT="${3:-4300}"

fail=0

check() {
  local name="$1" url="$2" grep_for="$3"
  local body
  body="$(curl -s --max-time 5 "$url")"
  if [ -z "$body" ]; then
    echo "FAIL  $name  ($url) — empty response, is it running?"
    fail=1
    return
  fi
  if [ -n "$grep_for" ] && ! grep -q "$grep_for" <<<"$body"; then
    echo "FAIL  $name  ($url) — response didn't contain '$grep_for'"
    echo "      got: $(head -c 200 <<<"$body")"
    fail=1
    return
  fi
  echo "OK    $name  ($url)"
}

echo "=== API ==="
check "health"     "http://localhost:${API_PORT}/api/health"    '"status":"ok"'
check "seed data"  "http://localhost:${API_PORT}/api/countries" '"iso2"'
check "swagger"    "http://localhost:${API_PORT}/api-json"      '"openapi"'

echo "=== webapp (port ${WEBAPP_PORT}) ==="
check "page loads" "http://localhost:${WEBAPP_PORT}/"                '<title>BellA'
check "api proxy"  "http://localhost:${WEBAPP_PORT}/api/countries"   '"iso2"'

echo "=== admin (port ${ADMIN_PORT}) ==="
check "page loads" "http://localhost:${ADMIN_PORT}/"                 '<html'
check "api proxy"  "http://localhost:${ADMIN_PORT}/api/countries"    '"iso2"'

if [ "$fail" -eq 0 ]; then
  echo "=== all checks passed ==="
else
  echo "=== one or more checks FAILED — see above ==="
fi
exit "$fail"
