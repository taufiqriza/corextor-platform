#!/usr/bin/env bash
set -euo pipefail

timestamp() {
    date -u +"%Y-%m-%dT%H:%M:%SZ"
}

log() {
    printf '[%s] %s\n' "$(timestamp)" "$*"
}

require_cmd() {
    command -v "$1" >/dev/null 2>&1 || {
        log "Required command not found: $1"
        exit 1
    }
}

require_file() {
    local path="$1"
    [ -f "$path" ] || {
        log "Required file not found: $path"
        exit 1
    }
}

require_parent_dir() {
    local path="$1"
    local parent
    parent="$(dirname "$path")"
    [ -d "$parent" ] || {
        log "Required parent directory not found: $parent"
        exit 1
    }
}

ensure_dir() {
    mkdir -p "$1"
}

backup_existing_path() {
    local path="$1"
    if [ -e "$path" ] || [ -L "$path" ]; then
        local backup_path="${path}.bak-${RELEASE_ID}"
        mv "$path" "$backup_path"
        log "Backed up $path -> $backup_path"
    fi
}

switch_docroot() {
    local label="$1"
    local docroot="$2"
    local target="$3"

    if [ -z "$docroot" ]; then
        log "Skipping $label docroot switch: target path is empty"
        return
    fi

    require_parent_dir "$docroot"
    backup_existing_path "$docroot"
    ln -sfn "$target" "$docroot"
    log "Docroot switched: $label -> $target"
}

DEPLOY_BASE="${DEPLOY_BASE:-/home/u435085854/deploy/corextor-platform}"
RELEASE_ID="${RELEASE_ID:?RELEASE_ID is required}"
REPO_URL="${REPO_URL:?REPO_URL is required}"
REPO_REF="${REPO_REF:-main}"
WEB_ARTIFACT="${WEB_ARTIFACT:?WEB_ARTIFACT is required}"
API_ENV_PATH="${API_ENV_PATH:-$DEPLOY_BASE/shared/api/.env}"
PRIMARY_DOCROOT="${PRIMARY_DOCROOT:-}"
EMPLOYEE_SUBDIR_NAME="${EMPLOYEE_SUBDIR_NAME:-app.corextor.com}"
API_SUBDIR_NAME="${API_SUBDIR_NAME:-api.corextor.com}"
SWITCH_DOCROOTS="${SWITCH_DOCROOTS:-0}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-1}"

RELEASE_DIR="$DEPLOY_BASE/releases/$RELEASE_ID"
WEB_RELEASE_DIR="$DEPLOY_BASE/releases/web-$RELEASE_ID"
DOCROOT_RELEASE_DIR="$DEPLOY_BASE/releases/docroot-$RELEASE_ID"
CURRENT_LINK="$DEPLOY_BASE/current"
CURRENT_WEB_LINK="$DEPLOY_BASE/current-web"
SHARED_API_DIR="$DEPLOY_BASE/shared/api"
SHARED_STORAGE_DIR="$SHARED_API_DIR/storage"

require_cmd git
require_cmd tar
require_cmd composer
require_cmd php

ensure_dir "$DEPLOY_BASE/artifacts"
ensure_dir "$DEPLOY_BASE/releases"
ensure_dir "$SHARED_STORAGE_DIR/app/public"
ensure_dir "$SHARED_STORAGE_DIR/framework/cache"
ensure_dir "$SHARED_STORAGE_DIR/framework/sessions"
ensure_dir "$SHARED_STORAGE_DIR/framework/testing"
ensure_dir "$SHARED_STORAGE_DIR/framework/views"
ensure_dir "$SHARED_STORAGE_DIR/logs"

require_file "$WEB_ARTIFACT"
require_file "$API_ENV_PATH"

if [ -e "$RELEASE_DIR" ] || [ -L "$RELEASE_DIR" ]; then
    log "Release directory already exists: $RELEASE_DIR"
    exit 1
fi

if [ -e "$WEB_RELEASE_DIR" ] || [ -L "$WEB_RELEASE_DIR" ]; then
    log "Web release directory already exists: $WEB_RELEASE_DIR"
    exit 1
fi

if [ -e "$DOCROOT_RELEASE_DIR" ] || [ -L "$DOCROOT_RELEASE_DIR" ]; then
    log "Docroot release directory already exists: $DOCROOT_RELEASE_DIR"
    exit 1
fi

log "Cloning $REPO_REF from $REPO_URL"
git clone --depth 1 --branch "$REPO_REF" "$REPO_URL" "$RELEASE_DIR"

log "Linking shared API environment"
ln -sfn "$API_ENV_PATH" "$RELEASE_DIR/api/.env"

log "Linking shared storage"
rm -rf "$RELEASE_DIR/api/storage"
ln -sfn "$SHARED_STORAGE_DIR" "$RELEASE_DIR/api/storage"

log "Installing API dependencies"
composer install \
    --no-dev \
    --no-interaction \
    --optimize-autoloader \
    --working-dir="$RELEASE_DIR/api"

log "Preparing API application"
(
    cd "$RELEASE_DIR/api"
    php artisan optimize:clear
    php artisan storage:link || true
    if [ "$RUN_MIGRATIONS" = "1" ]; then
        php artisan migrate --force
    fi
    php artisan config:cache
    php artisan route:cache
)

log "Extracting frontend artifact"
mkdir -p "$WEB_RELEASE_DIR"
tar -xzf "$WEB_ARTIFACT" -C "$WEB_RELEASE_DIR"

log "Assembling Hostinger docroot release"
mkdir -p "$DOCROOT_RELEASE_DIR/$EMPLOYEE_SUBDIR_NAME"
cp -a "$WEB_RELEASE_DIR/." "$DOCROOT_RELEASE_DIR/"
cp -a "$WEB_RELEASE_DIR/." "$DOCROOT_RELEASE_DIR/$EMPLOYEE_SUBDIR_NAME/"
ln -sfn "$CURRENT_LINK/api/public" "$DOCROOT_RELEASE_DIR/$API_SUBDIR_NAME"

ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"
ln -sfn "$DOCROOT_RELEASE_DIR" "$CURRENT_WEB_LINK"
log "Updated current release symlinks"

if [ "$SWITCH_DOCROOTS" = "1" ]; then
    log "Switching live Hostinger primary docroot"
    switch_docroot "primary" "$PRIMARY_DOCROOT" "$CURRENT_WEB_LINK"
else
    log "SWITCH_DOCROOTS=0, leaving live docroots unchanged"
fi

log "Remote deployment finished successfully"
