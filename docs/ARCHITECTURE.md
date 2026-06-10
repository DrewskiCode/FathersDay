# Pyro Pyro — System Architecture (Browser)

## Overview

Pyro Pyro is a lightweight **browser game** that emulates the feel of late-1970s Atari titles like *Adventure*: fixed rooms, chunky graphics, simple collision, and instant room transitions.

Game design lives in `SPEC.md`. Implementation is **TypeScript** on **HTML5 Canvas**, bundled with **Vite** for fast dev and static deployment.

---

## Design goals

1. **Easy to develop and deploy** — `npm run dev` locally; `npm run build` → static `dist/` for a link or USB.
2. **Adventure-style presentation** — one room per screen, no scrolling map; hard cuts at door edges.
3. **Retro aesthetic** — limited palette, pixel-aligned art, optional CRT-style scale-up (`image-rendering: pixelated`).
4. **Spec-driven** — rooms, fire stages, scoring, and milestones match `SPEC.md`; only the platform changed from the archived Atari build.

---

## Repository layout

| Path | Role |
|------|------|
| `game/src/main.ts` | Entry point, requestAnimationFrame loop |
| `game/src/game.ts` | State machine: title → playing → game over |
| `game/src/colors.ts` | Shared palette |
| `game/src/rooms/` | Room layouts, walls, doors (planned) |
| `game/src/entities/` | Player, computers, fires (planned) |
| `legacy-atari/` | Archived 6502 assembly — not used by the web build |

---

## Runtime flow

```
index.html
    └── main.ts
            ├── new Game(canvas ctx)
            └── requestAnimationFrame loop
                    ├── game.update(dt)
                    └── game.draw()
```

Future modules will split update/draw by state:

- **Title** — monitor + fire animation; Enter / click to start  
- **Playing** — input, room transitions, fire spawn/progression, extinguish, score  
- **Game over** — explosion summary, restart  

---

## Rendering

- **Internal resolution:** 320×240 (2× scale of a 160×120 logical grid; easy to read on modern displays).
- **Canvas CSS:** scaled up with `image-rendering: pixelated` for crisp blocks.
- **No WebGL** in v1 — Canvas 2D rectangles and sprites are enough for the Adventure look.

---

## Input

| Action | Default binding |
|--------|-----------------|
| Move | Arrow keys (8-direction) |
| Spray extinguisher | Space |
| Start / restart | Enter |

Keyboard-first; touch/gamepad can be added later.

---

## Data & persistence

- **Session high score** — `sessionStorage` (v1).
- **Room definitions** — TypeScript modules or JSON under `game/src/rooms/`.
- **No backend** — fully client-side.

---

## Build & deploy

```bash
cd game && npm install && npm run build
```

Output: `game/dist/` (HTML + JS + assets). Suitable for GitHub Pages, Netlify, Cloudflare Pages, or offline `index.html`.

---

## Relationship to `legacy-atari/`

The Melody Board cartridge project proved boot and timing on real hardware but playfield art was a poor fit for rapid iteration. The web edition keeps the **same game design** and abandons TIA/playfield constraints. Do not mix assembly kernels into `game/` — reference `legacy-atari/` only when porting behavior or palette choices.
