# Pyro Pyro — Atari 2600 (Archived)

This directory preserves the **Melody Board / F6SC** cartridge attempt. Active development moved to the browser game in [`../game/`](../game/).

## Hardware target

- Atari 2600 (NTSC)
- Melody Board — F6 + Superchip (16 KB ROM, 128 B cart RAM)

## Build & run

```bash
cd legacy-atari/build
./build.sh
./run-stella.sh
```

Output: `legacy-atari/dist/pyro-pyro.bin`

## Contents

| Path | Purpose |
|------|---------|
| `source/` | 6502 assembly (banks, kernel, modules) |
| `build/` | DASM build scripts, `gen_title.py` |
| `dasm-2.20.14.1-osx-x64/` | Bundled assembler |
| `Stella.app/` | Bundled emulator |
| `docs/` | `MEMORY_MAP.md`, `BANK_LAYOUT.md` |

## Why archived

Playfield-based title art and TIA timing made rapid iteration difficult. Game design in [`../SPEC.md`](../SPEC.md) is unchanged; only the implementation platform moved to TypeScript + Canvas.
