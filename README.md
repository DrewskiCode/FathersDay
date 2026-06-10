# Pyro Pyro

A Father's Day gift game — you play as **Pyro**, a senior programmer extinguishing office fires before the building explodes.

**Active target:** browser game (TypeScript + Canvas), *Adventure*-style rooms and retro aesthetic.

The original Atari 2600 / Melody Board assembly lives in [`legacy-atari/`](legacy-atari/) for reference.

## Quick start (browser)

```bash
cd game
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Build for deployment

```bash
cd game
npm run build
```

Static files land in `game/dist/`. Host on GitHub Pages, Netlify, or open `game/dist/index.html` locally.

## Project layout

```
FathersDay/
  SPEC.md              Game design spec (browser target)
  game/                Browser game (TypeScript, Vite, Canvas)
    src/               Game source
    dist/              Production build (after npm run build)
  docs/                Architecture and roadmap (web edition)
  legacy-atari/        Archived 6502 / Stella / cartridge build
```

## Documentation

| Doc | Purpose |
|-----|---------|
| [SPEC.md](SPEC.md) | Story, gameplay, rooms, fire rules, milestones |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Web app structure |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Development milestones |
| [legacy-atari/README.md](legacy-atari/README.md) | Original cartridge build |

## License

Game code: TBD.
