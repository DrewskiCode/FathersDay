#!/usr/bin/env bash
#==============================================================================
# build.sh — Assemble Pyro Pyro for Melody Board (F6SC, 16 KB)
#
# Usage: ./build/build.sh
# Output: dist/pyro-pyro.bin, dist/pyro-pyro.lst
#==============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DASM="${DASM:-$ROOT/dasm-2.20.14.1-osx-x64/dasm}"
VCS_DIR="$ROOT/dasm-2.20.14.1-osx-x64/machines/atari2600"
SRC="$ROOT/source/main.asm"
OUT_DIR="$ROOT/dist"
OUT_BIN="$OUT_DIR/pyro-pyro.bin"
OUT_LST="$OUT_DIR/pyro-pyro.lst"
OUT_SYM="$OUT_DIR/pyro-pyro.sym"

mkdir -p "$OUT_DIR"

if [[ ! -x "$DASM" ]]; then
    echo "ERROR: DASM not found at $DASM" >&2
    exit 1
fi

if [[ -f "$ROOT/build/gen_title.py" ]]; then
    (cd "$ROOT" && python3 "$ROOT/build/gen_title.py")
fi

echo "Assembling Pyro Pyro (F6SC / 16 KB)..."
"$DASM" "$SRC" \
    -f1 \
    -v5 \
    -I"$ROOT/source/include" \
    -I"$ROOT/source" \
    -I"$VCS_DIR" \
    -o"$OUT_BIN" \
    -l"$OUT_LST" \
    -s"$OUT_SYM"

SIZE=$(wc -c < "$OUT_BIN" | tr -d ' ')

# DASM -f1 prepends 2 stray bytes (00 00) before the first ORG, shifting the entire
# ROM by +2 and pushing the last 2 bytes past 16 KB. Strip the header and keep 16 KB.
if [[ "$SIZE" -eq 16386 ]] && [[ "$(xxd -p -l 2 "$OUT_BIN")" == "0000" ]]; then
    tail -c +3 "$OUT_BIN" | head -c 16384 > "$OUT_BIN.tmp"
    mv "$OUT_BIN.tmp" "$OUT_BIN"
    SIZE=16384
elif [[ "$SIZE" -gt 16384 ]]; then
    truncate -s 16384 "$OUT_BIN"
    SIZE=16384
fi

echo "Output: $OUT_BIN ($SIZE bytes)"

if [[ "$SIZE" -ne 16384 ]]; then
    echo "WARNING: Expected 16384 bytes for F6SC — got $SIZE" >&2
    exit 1
fi

echo "Build OK — ready for Stella with F6SC profile."
