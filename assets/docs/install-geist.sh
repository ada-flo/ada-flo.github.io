#!/bin/bash
# Install the Geist font family (Vercel, SIL OFL) into ~/Library/Fonts.
# No sudo needed. Safe to re-run.
set -uo pipefail

VERSION="v1.7.2"
URL="https://github.com/vercel/geist-font/releases/download/${VERSION}/geist-font-${VERSION}.zip"
WORK="$(mktemp -d)"
DEST="$HOME/Library/Fonts"

cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT

echo "==> Working dir: $WORK"

echo "==> Downloading Geist ${VERSION} ..."
if ! curl -fL --retry 3 --connect-timeout 20 -o "$WORK/geist.zip" "$URL"; then
  echo "FAILED: download. Check your network / the URL:"
  echo "  $URL"
  exit 1
fi
echo "    got $(du -h "$WORK/geist.zip" | cut -f1)"

echo "==> Unzipping ..."
if ! unzip -oq "$WORK/geist.zip" -d "$WORK/geist"; then
  echo "FAILED: unzip"
  exit 1
fi

echo "==> Font files found in the archive:"
find "$WORK/geist" \( -name '*.otf' -o -name '*.ttf' \) -print | sed 's/^/    /'

COUNT=$(find "$WORK/geist" \( -name '*.otf' -o -name '*.ttf' \) | wc -l | tr -d ' ')
if [ "$COUNT" -eq 0 ]; then
  echo "FAILED: no .otf/.ttf inside the archive. Contents were:"
  find "$WORK/geist" -maxdepth 2 | sed 's/^/    /'
  exit 1
fi

echo "==> Installing $COUNT files into $DEST ..."
mkdir -p "$DEST"
find "$WORK/geist" \( -name '*.otf' -o -name '*.ttf' \) -exec cp -f {} "$DEST"/ \;

echo "==> Rebuilding font cache ..."
fc-cache -f >/dev/null 2>&1 || true

echo "==> Verifying ..."
FAMILIES=$(fc-list : family 2>/dev/null | tr ',' '\n' | sort -u | grep -i geist || true)
if [ -z "$FAMILIES" ]; then
  echo "WARNING: fc-list does not report Geist yet."
  echo "Files that landed in $DEST:"
  ls "$DEST" | grep -i geist | sed 's/^/    /' || echo "    (none)"
  exit 1
fi

echo "SUCCESS. Installed families:"
echo "$FAMILIES" | sed 's/^/    /'
