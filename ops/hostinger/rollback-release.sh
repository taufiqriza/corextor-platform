#!/usr/bin/env bash
set -euo pipefail

timestamp() {
    date -u +"%Y-%m-%dT%H:%M:%SZ"
}

log() {
    printf '[%s] %s\n' "$(timestamp)" "$*"
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

backup_existing_path() {
    local path="$1"
    if [ -e "$path" ] || [ -L "$path" ]; then
        local backup_path="${path}.bak-rollback-$(date -u +%Y%m%d%H%M%S)"
        mv "$path" "$backup_path"
        log "Backed up $path -> $backup_path"
    fi
}

switch_docroot() {
    local label="$1"
    local docroot="$2"
    local target="$3"

    require_parent_dir "$docroot"
    backup_existing_path "$docroot"
    ln -sfn "$target" "$docroot"
    log "Docroot switched: $label -> $target"
}

resolve_previous_release_id() {
    local current_link="$1"
    local releases_dir="$2"

    if [ ! -L "$current_link" ]; then
        return 0
    fi

    local current_release
    current_release="$(basename "$(readlink "$current_link")")"

    find "$releases_dir" -maxdepth 1 -mindepth 1 -type d \
        -regextype posix-extended \
        -regex '.*/[0-9]{14}$' \
        | sed 's#.*/##' \
        | sort \
        | grep -v "^${current_release}$" \
        | tail -n 1
}

DEPLOY_BASE="${DEPLOY_BASE:-/home/u435085854/deploy/corextor-platform}"
PRIMARY_DOCROOT="${PRIMARY_DOCROOT:?PRIMARY_DOCROOT is required}"
TARGET_RELEASE_ID="${TARGET_RELEASE_ID:-}"

CURRENT_LINK="$DEPLOY_BASE/current"
CURRENT_WEB_LINK="$DEPLOY_BASE/current-web"
CANDIDATE_LINK="$DEPLOY_BASE/candidate"
CANDIDATE_WEB_LINK="$DEPLOY_BASE/candidate-web"
RELEASES_DIR="$DEPLOY_BASE/releases"

if [ -z "$TARGET_RELEASE_ID" ]; then
    TARGET_RELEASE_ID="$(resolve_previous_release_id "$CURRENT_LINK" "$RELEASES_DIR")"
fi

if [ -z "$TARGET_RELEASE_ID" ]; then
    log "Unable to determine rollback target release"
    exit 1
fi

TARGET_RELEASE_DIR="$RELEASES_DIR/$TARGET_RELEASE_ID"
TARGET_DOCROOT_DIR="$RELEASES_DIR/docroot-$TARGET_RELEASE_ID"

[ -d "$TARGET_RELEASE_DIR" ] || {
    log "Target release not found: $TARGET_RELEASE_DIR"
    exit 1
}

[ -d "$TARGET_DOCROOT_DIR" ] || {
    log "Target docroot release not found: $TARGET_DOCROOT_DIR"
    exit 1
}

ln -sfn "$TARGET_RELEASE_DIR" "$CURRENT_LINK"
ln -sfn "$TARGET_DOCROOT_DIR" "$CURRENT_WEB_LINK"
ln -sfn "$TARGET_RELEASE_DIR" "$CANDIDATE_LINK"
ln -sfn "$TARGET_DOCROOT_DIR" "$CANDIDATE_WEB_LINK"

log "Promoted rollback target to current: $TARGET_RELEASE_ID"
switch_docroot "primary" "$PRIMARY_DOCROOT" "$CURRENT_WEB_LINK"

log "Rollback finished successfully"
