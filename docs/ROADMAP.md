# Pyro Pyro — Development Roadmap (Browser)

Aligned with `SPEC.md`. Each milestone ends with a **playable build** via `cd game && npm run dev` or `npm run build`.

---

## Phase 0 — Repository & scaffold

**Status: COMPLETE**

- [x] Restructure repo: `game/` (web) + `legacy-atari/` (archived assembly)
- [x] Vite + TypeScript + Canvas shell
- [x] Update `SPEC.md`, `docs/ARCHITECTURE.md`, root `README.md`
- [x] Placeholder title (monitor + fire blocks)

**Exit criteria:** `npm run dev` shows title screen; `npm run build` produces `game/dist/`.

---

## Milestone 1 — Title screen

**Status: COMPLETE**

- [x] Readable **PYRO PYRO** title + subtitle
- [x] Animated fire on monitor (Canvas, not playfield)
- [x] Session high score inside monitor, above the flame
- [x] **PLAY** / **TUTORIAL** buttons (keyboard + click)
- [x] Tutorial: interactive walkthrough in practice office (move, spray, stages, reload, power-ups)

**Exit criteria:** Title looks intentional; Play starts a run; Tutorial teaches hands-on in the training room.

---

## Milestone 2 — Player movement (center room)

**Status: COMPLETE**

- [x] Arrow-key 8-direction movement
- [x] Center office room: walls, salmon floor, simple maze
- [x] Wall collision
- [x] Pyro sprite (colored rectangle → simple programmer shape)

**Exit criteria:** Walk around center room without passing through walls.

---

## Milestone 3 — Three-room layout

**Status: COMPLETE**

- [x] Left / center / right rooms per `SPEC.md`
- [x] Walk off left/right edge → room change (*Adventure*-style cut)
- [x] Spawn positions at inner doors

**Exit criteria:** Traverse all three rooms.

---

## Milestone 4 — Computers

**Status: COMPLETE**

- [x] 5 terminals per room (fixed positions)
- [x] Collision with computer bodies
- [x] Normal vs on-fire visual states (green working flash + growing desk flames)

**Exit criteria:** Desks block movement; screens show working / fire colors.

---

## Milestone 5 — Fire system

**Status: COMPLETE**

- [x] Random ignite on computers (unlocked wings only)
- [x] Yellow → orange → red progression (slower off-screen)
- [x] Red-fire timeout → game over (nuke exterior sequence)
- [x] Round-based wing unlock (center R1–3, +left R4–6, +right R7+)
- [x] Wing lock doors + explore prompts on R4 / R7
- [x] Door fire indicators for adjacent burning rooms

**Exit criteria:** Survive escalating rounds until a red fire explodes the office.

---

## Milestone 6 — Extinguisher

**Status: COMPLETE**

- [x] Space to spray (~1 s foam animation, −1 use per spray)
- [x] Directional extinguish when a burning desk is in front of Pyro
- [x] Uses meter (10/10); empty = no spray
- [x] Refill stations on walls (R to reload, 3 s bar)
- [x] Hand-held extinguisher sprite

**Exit criteria:** Spray fires, reload at wall stations, manage limited uses.

---

## Milestone 7 — Scoring

**Status: COMPLETE**

- [x] Score HUD top-left (current score + HI + gain pulse)
- [x] +100 normal fires, +200 special, +1555 rainbow
- [x] Session high score (`sessionStorage`) on title + game over

**Exit criteria:** Score visible during play; best run persists for the session.

---

## Milestone 8 — Power-up fires

**Status: COMPLETE**

- [x] 1-in-5 ignites are special (purple / green / white / rainbow)
- [x] Special fires do not progress yellow → red
- [x] **Purple:** unlimited spray 30 s
- [x] **Green:** clears all active fires in unlocked wings
- [x] **White:** ghost-walk through walls 30 s
- [x] **Rainbow:** 1555 points

**Exit criteria:** Special fires spawn, award points/effects when sprayed out.

---

## Milestone 9 — Game over & restart

**Status: COMPLETE**

- [x] Exterior office in grassy field → nuke explosion (shake, cracks, impact frames)
- [x] High score fade-in
- [x] Main Menu / Play Again options

**Exit criteria:** Losing run shows full sequence; player can restart or return to title.

---

## Milestone 10 — Polish

**Status: PARTIAL**

- [x] Sound (Web Audio API bleeps: spray, extinguish, score, power-up, ignite, game over)
- [x] Round-based difficulty scaling (ignite interval + stage speed per round)
- [ ] Deploy to static host; Father's Day handoff

**Exit criteria:** Audio feedback in-game; difficulty ramps with round; ready to ship.

---

## Archived work

The Atari 2600 cartridge path (Phase 0–M1 assembly) is preserved under `legacy-atari/`. It is **not** on the active roadmap unless you explicitly resume hardware development.
