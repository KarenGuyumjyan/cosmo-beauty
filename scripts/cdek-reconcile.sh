#!/bin/sh
#
# Poll CDEK for every in-flight order and sync delivery statuses.
#
# This replaces the `crons` block in vercel.json, which only ever worked while
# the app was hosted on Vercel - nothing on a self-hosted Node server reads
# that file, so after the move the job silently stopped running and orders sat
# at SHIPPED after CDEK had already marked them DELIVERED.
#
# Install as the user that owns the app:
#
#   chmod +x scripts/cdek-reconcile.sh
#   crontab -e
#   0 23 * * * /path/to/cosmo-beauty/scripts/cdek-reconcile.sh >> /var/log/cdek-reconcile.log 2>&1
#
# IMPORTANT: crontab schedules use the SERVER's timezone, not Moscow's. Check
# it with `timedatectl`, then pick the matching line for 23:00 MSK:
#
#   Europe/Moscow -> 0 23 * * *
#   UTC           -> 0 20 * * *
#
# Overridable via the environment:
#   APP_URL      base URL of the running app (default: http://127.0.0.1:3000)
#   CRON_SECRET  bearer token; read from .env when not already exported

set -eu

APP_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)"
APP_URL="${APP_URL:-http://127.0.0.1:3000}"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S%z')] $*"
}

# cron runs with a nearly empty environment, so the secret almost never comes
# from the shell - read it out of the app's own .env instead of duplicating it.
if [ -z "${CRON_SECRET:-}" ] && [ -f "$APP_DIR/.env" ]; then
  CRON_SECRET="$(sed -n 's/^CRON_SECRET=//p' "$APP_DIR/.env" | head -n 1 | tr -d '"'\''' | tr -d '\r')"
fi

# -m matches the route's maxDuration: a large backlog can legitimately take
# minutes, and cutting the connection early would abort it mid-run.
if [ -n "${CRON_SECRET:-}" ]; then
  BODY="$(curl -sS -m 300 -w '\n%{http_code}' \
    -H "Authorization: Bearer $CRON_SECRET" \
    "$APP_URL/api/cdek/reconcile")" || {
    log "FAILED: could not reach $APP_URL"
    exit 1
  }
else
  log "WARNING: CRON_SECRET is not set - the endpoint is unauthenticated"
  BODY="$(curl -sS -m 300 -w '\n%{http_code}' \
    "$APP_URL/api/cdek/reconcile")" || {
    log "FAILED: could not reach $APP_URL"
    exit 1
  }
fi

STATUS="$(echo "$BODY" | tail -n 1)"
PAYLOAD="$(echo "$BODY" | sed '$d')"

if [ "$STATUS" != "200" ]; then
  log "FAILED: HTTP $STATUS - $PAYLOAD"
  exit 1
fi

log "OK: $PAYLOAD"
