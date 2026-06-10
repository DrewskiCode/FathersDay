#!/usr/bin/env bash
#==============================================================================
# run-stella.sh — Launch pyro-pyro.bin in Stella emulator (F6SC profile)
#
# Usage: ./build/run-stella.sh
# Requires: dist/pyro-pyro.bin (run build.sh first)
#==============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ROM="$ROOT/dist/pyro-pyro.bin"
STELLA="${STELLA:-$ROOT/Stella.app/Contents/MacOS/Stella}"

if [[ ! -f "$ROM" ]]; then
    echo "ERROR: $ROM not found — run ./build/build.sh first" >&2
    exit 1
fi

if [[ ! -x "$STELLA" ]]; then
    echo "ERROR: Stella not found at $STELLA" >&2
    exit 1
fi

PRO="$ROOT/dist/pyro-pyro.pro"

echo "Launching Stella (F6SC profile)..."
cat > "$PRO" <<EOF
; Stella cartridge properties for Pyro Pyro (Melody F6SC)
type F6SC
Display.Format NTSC
startbank 0
EOF

echo "ROM:  $ROM"
echo "Stella: $STELLA"
exec "$STELLA" -bs F6SC -tv NTSC -startbank 0 \
    -plr.bankrandom 0 -dev.bankrandom 0 \
    -plr.tv.jitter 0 -dev.tv.jitter 0 \
    -confirmexit 0 "$ROM"
