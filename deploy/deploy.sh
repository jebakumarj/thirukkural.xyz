#!/usr/bin/env bash
#
# Builds the site and copies it to the server as a new release, then flips the
# `current` symlink. Rolling back is re-pointing that symlink at the previous
# release directory, which stays on disk.
#
#   ./deploy/deploy.sh                 # build and deploy
#   SKIP_BUILD=1 ./deploy/deploy.sh    # deploy whatever is already in dist/
#
# Configure once via environment variables or a deploy/.env file:
#   DEPLOY_HOST=user@your-server
#   DEPLOY_PATH=/var/www/thirukkural
#   KEEP_RELEASES=5

set -euo pipefail

cd "$(dirname "$0")/.."

[ -f deploy/.env ] && . deploy/.env

DEPLOY_HOST="${DEPLOY_HOST:?set DEPLOY_HOST, e.g. deploy@thirukkural.xyz}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/thirukkural}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"
DIST="dist/thirukkural/browser"
RELEASE="$(date +%Y%m%d-%H%M%S)"

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  echo "==> building"
  npm run build
fi

if [ ! -f "$DIST/index.html" ] || [ ! -f "$DIST/ngsw.json" ]; then
  echo "error: $DIST does not look like a finished build" >&2
  exit 1
fi

echo "==> uploading release $RELEASE to $DEPLOY_HOST"
ssh "$DEPLOY_HOST" "mkdir -p '$DEPLOY_PATH/releases/$RELEASE'"

# --delete keeps a release directory identical to the build, and the trailing
# slash on the source copies the contents rather than the directory itself.
rsync -az --delete --human-readable \
  "$DIST/" "$DEPLOY_HOST:$DEPLOY_PATH/releases/$RELEASE/"

echo "==> activating"
ssh "$DEPLOY_HOST" bash -s <<EOF
set -euo pipefail
ln -sfn '$DEPLOY_PATH/releases/$RELEASE' '$DEPLOY_PATH/current.tmp'
mv -Tf '$DEPLOY_PATH/current.tmp' '$DEPLOY_PATH/current'
ls -1dt '$DEPLOY_PATH'/releases/*/ | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf
EOF

echo "==> done: $RELEASE is live"
