#!/bin/sh
set -eu

case "${1:-}" in
    serve)
        shift
        for arg in "$@"; do
            case "$arg" in
                --http=*) address=${arg#--http=} ;;
                --dir=*) directory=${arg#--dir=} ;;
            esac
        done
        export MEALPLAN_DB_PATH="$directory/data.db"
        export MEALPLAN_DB_PORT="${address##*:}"
        export MEALPLAN_API_PORT=0
        exec "$HEALTHMATE_SERVER_BIN" serve
        ;;
    migrate|superuser)
        # The selected HTTP suites need neither PocketBase migrations nor superuser API access.
        exit 0
        ;;
esac

if [ "$#" != 1 ]; then
    echo "Usage: run-legacy-http.sh <built-healthmate-server>" >&2
    exit 2
fi

HEALTHMATE_SERVER_BIN=$(realpath "$1")
POCKETBASE_BIN=$(realpath "$0")
export HEALTHMATE_SERVER_BIN POCKETBASE_BIN
test -x "$HEALTHMATE_SERVER_BIN"
tests=$(dirname "$POCKETBASE_BIN")/../../../server
exec node --test --test-name-pattern='two devices synchronize|device sessions are owner-scoped' \
    "$tests/workspace.test.mjs" "$tests/device-sessions.test.mjs"
