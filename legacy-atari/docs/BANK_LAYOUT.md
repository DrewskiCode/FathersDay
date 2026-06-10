# Pyro Pyro — Bank Layout Plan

**Cartridge profile:** F6 + Superchip (F6SC)  
**Total ROM:** 16 KB (4 × 4 KB banks)  
**Target hardware:** Melody Board (supports F6SC natively)

---

## Why F6 + Superchip?

| Requirement | How F6SC helps |
|-------------|----------------|
| Title + Game + Game Over screens | 4 banks separates code from bulky data |
| 4–8 room office maze | Room maps and playfield data in Bank 3 |
| Up to 8 simultaneous fires | Superchip RAM holds fire table without starving ZP |
| Sound + kernel + gameplay | Bank 1 kernel isolated from Bank 2 logic |
| Melody compatibility | F6SC is a standard Melody profile; no custom scheme needed for v1 |

**Upgrade path:** If Bank 3 fills (>4 KB assets), migrate to **F4+SC (32 KB / 8 banks)** — Melody supports this without hardware changes.

---

## Bank 0 — System Core (~4 KB)

**ORG `$0000` / RORG `$F000` | Switch address: `$1FF8`**

| Section | Source Files | Budget | Contents |
|---------|--------------|--------|----------|
| Vectors | `bank0.asm` | 8 B | `$FFFC` reset → `Reset` |
| Startup | `common/startup.asm` | ~64 B | `CLEAN_START`, `InitSystems` |
| Bankswitch stubs | `common/bankswitch.asm` | ~128 B | Trampolines to Banks 1–3 |
| Main loop | `bank0.asm` | ~128 B | Frame orchestration shell |
| State machine | `modules/state.asm` | ~256 B | FSM dispatch (stub) |
| Reserved | — | ~3.4 KB | Future: difficulty scaling, RNG, save high score |

**Design rule:** Bank 0 is always switched in first at power-on. All cross-bank calls return here for the main loop.

---

## Bank 1 — Display & Screens (~4 KB)

**ORG `$1000` / RORG `$F000` | Switch address: `$1FF9`**

| Section | Source Files | Budget | Contents |
|---------|--------------|--------|----------|
| Vectors | `bank1.asm` | 8 B | Safety reset → switch to Bank 0 |
| Kernel core | `kernel/kernel.asm` | ~512 B | Frame template: VSYNC/VBLANK/OVS |
| VBLANK/OVS | `kernel/vblank.asm`, `overscan.asm` | ~256 B | Timing shells |
| Scanline kernel | `kernel/display.asm` | ~1.5 KB | Playfield + sprite shell (stub) |
| Title screen | `modules/title.asm` | ~512 B | Title update hook (stub) |
| Game over | `modules/gameover.asm` | ~512 B | Game over hook (stub) |
| Reserved | — | ~1 KB | Flicker management, screen transitions |

**Design rule:** No gameplay simulation here — only read RAM and draw. Keeps scanline timing predictable.

---

## Bank 2 — Gameplay Logic (~4 KB)

**ORG `$2000` / RORG `$F000` | Switch address: `$1FF6`**

| Section | Source Files | Budget | Contents |
|---------|--------------|--------|----------|
| Vectors | `bank2.asm` | 8 B | Safety reset → switch to Bank 0 |
| Input | `modules/input.asm` | ~256 B | Joystick read/debounce (stub) |
| Player | `modules/player.asm` | ~512 B | 8-way movement shell (stub) |
| Fire | `modules/fire.asm` | ~768 B | Spawn/progression shell (stub) |
| Extinguisher | `modules/extinguisher.asm` | ~512 B | Spray/fuel shell (stub) |
| Office | `modules/office.asm` | ~768 B | Room/door/collision shell (stub) |
| Score | `modules/score.asm` | ~256 B | Scoring shell (stub) |
| Reserved | — | ~1 KB | Power-up fires, difficulty ramp |

**Design rule:** All modules expose a single `Update*` entry point called from vblank via bankswitch.

---

## Bank 3 — Data & Assets (~4 KB)

**ORG `$3000` / RORG `$F000` | Switch address: `$1FF7`**

| Section | Source Files | Budget | Contents |
|---------|--------------|--------|----------|
| Vectors | `bank3.asm` | 8 B | Safety reset → switch to Bank 0 |
| Sprites | `data/sprites.asm` | ~512 B | Player, fire, computer bitmaps (placeholder) |
| Playfield | `data/playfield.asm` | ~1 KB | Wall/room PF patterns (placeholder) |
| Room maps | `data/rooms.asm` | ~512 B | 4–8 room connectivity tables (placeholder) |
| Sounds | `data/sounds.asm` | ~512 B | AUDC/AUDF/AUDV sequences (placeholder) |
| Lookup tables | `data/tables.asm` | ~256 B | Direction vectors, score tables |
| Reserved | — | ~1 KB | Title/gameover PF art, fonts |

**Design rule:** Bank 3 should be mostly `byte`/`word` tables. Code here is limited to bank-local table walks.

---

## Bankswitch Trampoline Map

Trampolines live at fixed offsets near `$FFE0` in Bank 0 so other banks can `jsr` consistently.

| Stub Name | Target Bank | Purpose |
|-----------|-------------|---------|
| `CallBank1` | 1 | Kernel / title / gameover |
| `CallBank2` | 2 | Gameplay updates |
| `CallBank3` | 3 | Data lookups (if ever needed at runtime) |

Implementation: `source/common/bankswitch.asm`

---

## ROM Budget Summary

| Bank | Used (est.) | Free (est.) | Risk |
|------|-------------|-------------|------|
| 0 | ~0.6 KB | ~3.4 KB | Low |
| 1 | ~1.5 KB | ~2.5 KB | Medium (kernel growth) |
| 2 | ~1.5 KB | ~2.5 KB | Medium (fire + office logic) |
| 3 | ~0.5 KB | ~3.5 KB | Low now; fills with art |

Monitor with `build/build.sh` listing output — DASM reports bytes used per segment.

---

## Stella / Melody Build Profile

| Setting | Value |
|---------|-------|
| Stella profile | `F6SC` |
| ROM file | `dist/pyro-pyro.bin` |
| Expected size | 16384 bytes (16 KB) |
| Region | NTSC |

Melody programming at AtariAge expects a valid F6SC binary of exactly 16 KB.
