# PROJECT SPECIFICATION

## Project Name

Pyro Pyro

## Purpose

This is a Father's Day gift game: a humorous office firefighting adventure starring **Pyro**, a senior programmer.

The game should feel like a polished **late-1970s Atari-style** title — especially *Adventure* — with fixed rooms, chunky graphics, and simple controls. It is implemented as a **lightweight browser game** for easy development and deployment (share a link or a `dist/` folder).

An earlier **Atari 2600 / Melody Board** prototype is archived in `legacy-atari/`; it is not the active target.

---

# Platform Target

| Item | Choice |
|------|--------|
| **Runtime** | Modern web browser (Chrome, Safari, Firefox) |
| **Stack** | TypeScript, HTML5 Canvas 2D, Vite |
| **Deploy** | Static files (`game/dist/`) — GitHub Pages, Netlify, or local `index.html` |
| **Resolution** | 320×240 internal canvas, CSS-scaled with pixelated upscaling |
| **Frame rate** | 60 FPS via `requestAnimationFrame` |

## Development environment

```bash
cd game
npm install
npm run dev      # local development
npm run build    # production bundle → game/dist/
```

## Code requirements

* TypeScript with strict mode  
* Modular source under `game/src/`  
* Game design constants in dedicated modules (no magic numbers)  
* Separate update logic from rendering where practical  
* Comment non-obvious gameplay rules  
* No server required — fully client-side  

## Repository layout

```
game/                 Active browser game
docs/                 Architecture and roadmap (web)
SPEC.md               This file — design source of truth
legacy-atari/         Archived 6502 assembly + Stella build
```

---

# Game Story

You play as Pyro, a senior computer programmer who works in a large office.

Computers throughout the office randomly catch on fire.

Your job is to run around the office and put out the fires before they spread and destroy the building.

The game should have a humorous and lighthearted tone.

---

# Core Gameplay

Player:

* Name: Pyro
* Movement: 8-direction movement (Adventure-style room navigation)
* Controlled with keyboard (arrow keys; gamepad optional later)
* Space bar sprays extinguisher foam when near a fire

Goal:

* Extinguish fires
* Earn points
* Prevent office destruction

Lose Condition:

* Any large red fire that remains active too long causes a catastrophic office explosion
* Immediate game over

---

# World Layout — Three-Screen Office

The office is **three full screens** (rooms), presented one at a time — similar to *Adventure*, not one scrolling map.

## The Three Rooms

| Room | Name | Role |
|------|------|------|
| 0 | **Left Office** | Side room — computers along walls |
| 1 | **Center Office** | **Starting room** — hub between left and right |
| 2 | **Right Office** | Side room — computers along walls |

## Navigation

* Player **starts in the Center Office** (middle of the screen).
* Walk **off the left edge** of the center room → enter **Left Office** (spawn near the right side).
* Walk **off the right edge** of the center room → enter **Right Office** (spawn near the left side).
* From a side room, walk off the **inner edge** (toward center) → return to **Center Office**.

Only horizontal room changes exist in v1 (no north/south rooms).

## Each Screen Contains

* **Walls** forming a **simple maze** — player must walk around obstacles.
* **Multiple small computers** (compact terminals — smaller than a full desk).
* **Open floor** for walking between walls.
* **Optional refill station** on a wall (one per side room in v1).

Each room is a self-contained layout with collision against walls and computers.

---

# Computers

* **Small sprite size** — roughly half the visual footprint of a full desk terminal; **4–6 per room**.
* Fixed positions per room (defined in room data).
* A computer without fire shows as a normal terminal; fire draws on top of the computer.

---

# Fire System

Computers randomly ignite.

Each fire progresses through three stages.

| Stage | Color | Danger |
|-------|-------|--------|
| 1 | Yellow | New fire, lowest danger |
| 2 | Orange | Increased danger |
| 3 | Red | Critical |

Progression: Yellow → Orange → Red

If a red fire survives beyond a critical timer:

* Office explodes
* Game Over

Fire growth rate should gradually increase as score rises.

---

# Extinguisher System

Player starts with limited extinguisher fuel.

**When Pyro is close to an active fire**, pressing Space sprays foam and extinguishes that fire (proximity-based in v1).

Extinguisher fuel decreases while spraying.

When fuel reaches zero:

* Extinguisher becomes unusable until refilled

**Refill stations:**

* Mounted on office walls (side rooms)
* Walking into one fully refills extinguisher

---

# Special Fires

Special fires do not grow.

**Purple fire:** 200 points, unlimited fuel for 30 seconds.

**Green fire:** 200 points, instantly extinguishes every active fire in the office.

Special fires should appear infrequently.

---

# Scoring

| Fire type | Points |
|-----------|--------|
| Yellow / Orange / Red | 100 each |
| Purple / Green | 200 each |

Display score at top of screen. Session high score stored in `sessionStorage`.

---

# Difficulty Scaling

As score increases:

* Fires spawn more frequently
* Multiple simultaneous fires become possible
* Fire progression becomes faster

Difficulty scales across all three rooms.

---

# Visual Style

**Aesthetic:** Classic Atari / *Adventure* — one room fills the screen at a time.

* **Palette:** Limited colors (`game/src/colors.ts`) — salmon floor, grey walls, warm fire hues.
* **Player:** Distinct programmer sprite (Pyro).
* **Computers:** Small blocky terminals.
* **Walls:** Solid rectangles, maze-like obstacles.
* **Fires:** Yellow / orange / red (purple / green for power-ups).
* **Rendering:** Canvas rectangles and simple shapes; no anti-aliased “modern” UI.

Pixel-aligned drawing; optional subtle flicker on flames for retro feel.

---

# Sound Design

Web Audio API (planned):

* Extinguisher spray
* Fire crackle
* Refill chime
* Power-up cue
* Game over explosion
* Score chime

---

# Title Screen

Simple, readable, thematic — **no playfield bit tricks**.

* Full-screen (or near full-screen) **computer monitor** with **animated fire** in the center.
* **PYRO PYRO** title text (legible typography, not bitmap letter hacks).
* Subtitle: *The Office Firefighter* (optional).
* **Press Enter to Start** (or equivalent).
* Canvas-drawn; animated flame via frame toggle or simple particle shapes.

Implementation: `game/src/game.ts` title state.

---

# Game Over Screen

* Exterior of office at night (simplified illustration).
* Building on fire; optional fireworks.
* **GAME OVER** + **FINAL SCORE**
* Press Enter to restart.

---

# Development Milestones

See `docs/ROADMAP.md` for checklist detail.

| # | Milestone |
|---|-----------|
| 0 | Repo scaffold, Vite, placeholder title ✓ |
| 1 | Title screen — monitor, fire, start |
| 2 | Player movement in center room |
| 3 | Three-room layout and door transitions |
| 4 | Computers per room |
| 5 | Fire spawn and 3-stage progression |
| 6 | Extinguisher + refill stations |
| 7 | Scoring and high score |
| 8 | Power-up fires |
| 9 | Game over and restart |
| 10 | Audio, difficulty polish, deploy |

---

# Coding Rules

* Prefer named constants and typed modules.
* Keep `SPEC.md` gameplay rules in sync with implementation.
* Put new game code under `game/src/` only.
* Do not modify `legacy-atari/` unless resuming the cartridge port.
* Prioritize playable milestones over visual complexity.

---

# Archived: Atari 2600 Target

The `legacy-atari/` tree contains the former Melody Board (F6SC) assembly project: DASM, Stella, kernels, and `dist/pyro-pyro.bin`. Build with:

```bash
cd legacy-atari/build && ./build.sh
./run-stella.sh
```

That path is **frozen**; the Father's Day deliverable is the **browser game** in `game/`.
