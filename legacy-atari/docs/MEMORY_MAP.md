# Pyro Pyro — Memory Map

Target: **NTSC Atari 2600 + F6 Superchip (F6SC) on Melody Board**

---

## CPU Address Space (visible each frame)

| Range | Size | Device | Notes |
|-------|------|--------|-------|
| `$0000–$007F` | 128 B | TIA write registers | Mirrors every 64 bytes |
| `$0080–$00FF` | 128 B | Zero Page RAM | System RAM — kernel temps + hot pointers |
| `$0280–$0297` | 24 B | RIOT registers | Timers, SWCHB, SWCHA |
| `$0100–$01FF` | 256 B | Stack | grows down from `$01FF` |
| `$0200–$027F` | 128 B | RAM | General purpose (avoid if possible — use ZP + SC) |
| `$F000–$F07F` | 128 B | **Superchip write port** | Persistent game state (write-only) |
| `$F080–$F0FF` | 128 B | **Superchip read port** | Same bytes, read-only mirror (+$80) |
| `$F000–$FFFF` | 4 KB | **Cartridge ROM window** | One of four F6 banks visible at a time |

Melody maps Superchip RAM at the standard Atari `$1000` cart window, which appears as `$F000` when using `RORG $F000` assembly convention.

---

## Zero Page Allocation (`$80–$FF`)

Reserved for **kernel-critical** data only. Gameplay state lives in Superchip RAM.

| Address | Symbol | Size | Owner | Purpose |
|---------|--------|------|-------|---------|
| `$80–$81` | `pfrow` | 2 | kernel | Playfield row pointer |
| `$82–$83` | `temp1` | 2 | kernel | General kernel temp |
| `$84` | `scanline` | 1 | kernel | Current scanline counter |
| `$85` | `kernelState` | 1 | kernel | Which display section we're drawing |
| `$86–$87` | `spritePtr` | 2 | kernel | Player sprite data pointer |
| `$88–$8F` | — | 8 | — | Reserved for kernel expansion |
| `$90–$9F` | `frameTemps` | 16 | common | Shared vblank scratch (not preserved scan-to-scan) |
| `$A0–$BF` | — | 32 | — | Reserved |
| `$C0–$FF` | — | 64 | — | Reserved for future kernel/multisprite |

> **Rule:** Modules must not allocate ZP variables without updating this table.

---

## Superchip RAM Allocation (`$F000–$F07F` write)

128 bytes for all persistent game state. Read using `address + $80`.

### System / Frame (`$F000–$F00F`)

| Write Addr | Read Addr | Symbol | Size | Purpose |
|------------|-----------|--------|------|---------|
| `$F000` | `$F080` | `gameState` | 1 | FSM: Title / Playing / GameOver |
| `$F001` | `$F081` | `frameCounter` | 1 | Free-running frame tick (wraps) |
| `$F002` | `$F082` | `quarterFrame` | 1 | Sub-frame timer for fire/audio |
| `$F003` | `$F083` | `randSeed` | 1 | LFSR seed for deterministic RNG |
| `$F004–$F005` | `$F084–$F085` | `score` | 2 | BCD or binary score (TBD at M7) |
| `$F006–$F007` | `$F086–$F087` | `highScore` | 2 | Session high score |
| `$F008–$F00F` | `$F088–$F08F` | — | 8 | Reserved system |

### Player (`$F010–$F01F`)

| Write Addr | Symbol | Size | Purpose |
|------------|--------|------|---------|
| `$F010` | `playerX` | 1 | Player horizontal position |
| `$F011` | `playerY` | 1 | Player vertical position |
| `$F012` | `playerDir` | 1 | Facing / movement direction (8-way) |
| `$F013` | `playerFlags` | 1 | Spraying, moving, powered-up bits |
| `$F014` | `extinguisherFuel` | 1 | 0–255 fuel gauge |
| `$F015` | `powerUpTimer` | 1 | Ticks remaining for purple power-up |
| `$F016–$F01F` | — | 10 | Reserved player expansion |

### Fire System (`$F020–$F04F`)

Space for up to **8 simultaneous fires** (4 bytes each = 32 bytes).

Per-fire record (4 bytes):

| Offset | Field | Purpose |
|--------|-------|---------|
| +0 | `fireFlags` | Active, stage, special type |
| +1 | `fireX` | Room-local X |
| +2 | `fireY` | Room-local Y |
| +3 | `fireTimer` | Stage progression / critical red timer |

Base: `fireTable` = `$F020` (8 × 4 = 32 bytes → `$F020–$F03F`)

| `$F040–$F04F` | — | 16 | Fire system globals (spawn rate, counts) |

### Office / World (`$F050–$F06F`)

| `$F050` | `currentRoom` | 1 | Active room index (0–7) |
| `$F051` | `roomFlags` | 1 | Bitfield: visited, alarm, etc. |
| `$F052–$F053` | `mapCursor` | 2 | Level generation / scroll temp |
| `$F054–$F06F` | — | 28 | Room state, door flags, computer indices |

### Audio / Misc (`$F070–$F07F`)

| `$F070` | `audioFlags` | 1 | Which sounds active |
| `$F071` | `audioFrame` | 1 | Sound sequencer tick |
| `$F072–$F07F` | — | 14 | Audio params, debug, padding |

**Total allocated:** 128 bytes (full Superchip — no slack; expand to F4+SC or Melody extended RAM if needed)

---

## ROM Map (F6 — 16 KB total)

| File Offset | CPU Bank Select | Contents |
|-------------|-----------------|----------|
| `$0000–$0FFF` | Bank 0 (`$1FF8`) | Bootstrap, main loop, state machine |
| `$1000–$1FFF` | Bank 1 (`$1FF9`) | Kernel, title, game over |
| `$2000–$2FFF` | Bank 2 (`$1FF6`) | Gameplay modules |
| `$3000–$3FFF` | Bank 3 (`$1FF7`) | Data / assets |

Bankswitch hotspots (read to switch):

| Address | Selects Bank |
|---------|--------------|
| `$1FF6` | Bank 2 |
| `$1FF7` | Bank 3 |
| `$1FF8` | Bank 0 |
| `$1FF9` | Bank 1 |

Each bank repeats reset vectors at `$FFFC`/`$FFFA` pointing to a bank-safe startup path.

---

## TIA Register Usage Plan

Documented in `source/include/hardware.asm`. Kernel owns all TIA writes during active display; modules request changes via RAM flags consumed in vblank.

| Register Group | Used For |
|----------------|----------|
| `VSYNC`, `VBLANK`, `WSYNC` | Frame timing |
| `PF0–PF2`, `CTRLPF`, `COLUPF`, `COLUBK` | Office walls / room playfield |
| `GRP0`, `GRP1`, `REFP0/1`, `NUSIZ0/1`, `COLUP0/1` | Pyro + fire sprites (flicker) |
| `AUDC0/1`, `AUDF0/1`, `AUDV0/1` | Extinguisher, fire crackle, chimes |

Every TIA write in source must include an inline comment naming the register and visual effect.
