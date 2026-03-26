#!/usr/bin/env bash
set -euo pipefail

if [ "${1:-}" = "" ]; then
    echo "Usage: $0 <output-tar-gz> [source-dir]" >&2
    exit 1
fi

OUTPUT_PATH="$1"
SOURCE_DIR="${2:-$(cd "$(dirname "$0")/../.." && pwd)}"
OUTPUT_REALPATH=""
SOURCE_REALPATH=""

if command -v realpath >/dev/null 2>&1; then
    OUTPUT_REALPATH="$(realpath "$OUTPUT_PATH" 2>/dev/null || true)"
    SOURCE_REALPATH="$(realpath "$SOURCE_DIR" 2>/dev/null || true)"
fi

mkdir -p "$(dirname "$OUTPUT_PATH")"

tar_args=(
  --exclude-vcs
  --exclude='.DS_Store'
  --exclude='._*'
  --exclude='.github'
  --exclude='api/vendor'
  --exclude='api/storage'
  --exclude='doc'
  --exclude='ops/cicd/templates'
  --exclude='ops/hostinger/examples'
  --exclude='web/node_modules'
  --exclude='web/dist'
  --exclude='node_modules'
)

if [ -n "$OUTPUT_REALPATH" ] && [ -n "$SOURCE_REALPATH" ]; then
    case "$OUTPUT_REALPATH" in
        "$SOURCE_REALPATH"/*)
            relative_output="${OUTPUT_REALPATH#$SOURCE_REALPATH/}"
            tar_args+=("--exclude=$relative_output")
            ;;
    esac
fi

COPYFILE_DISABLE=1 tar \
    "${tar_args[@]}" \
    -czf "$OUTPUT_PATH" \
    -C "$SOURCE_DIR" \
    .

echo "Created source archive: $OUTPUT_PATH"
