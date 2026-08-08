# Pixel Racing Sim

A dot-pixel-art racing simulation built with Next.js (App Router) + TypeScript.

**Play it live: https://mihyho.github.io/racing_game/**

## Gameplay

- Pick a map (산 / 도시 / 작은마을 / 골목길), then a vehicle, then race.
- Each map is a random mix of uphill / flat / downhill zones — mountain has
  the most elevation change, alley the least, flat ground is the same
  everywhere. The current segment is shown in the top-right corner.
- Weather (맑음 / 비 / 눈) is rolled at the start of each race and affects
  speed and how quickly you need to react to events.
- Random events (rockfall, pedestrians, obstacles, signal changes) pop up
  during the race — press the hazard-light button in time or you'll crash
  and stall for a few seconds. Reaction time gets stricter the faster
  you're going.
- Alley is narrow: go too fast and you'll clip the surrounding structures.
- Manual gears (1–6) or AUTO; finishing grades you S/A/B/C based on time.

## Development

```bash
npm install
npm run dev
```

Note: the app is configured for a GitHub Pages project site, so in dev it's
served under a `/racing_game` base path — open
[http://localhost:3000/racing_game](http://localhost:3000/racing_game).

```bash
npm run test    # vitest — pure game-logic tests
npm run lint
npm run build   # static export to ./out (see next.config.ts)
```

## Deployment

Pushing to `main` builds a static export and deploys it to GitHub Pages via
the workflow in `.github/workflows/deploy.yml`. In the repo settings,
**Settings → Pages → Build and deployment → Source** must be set to
**"GitHub Actions"** for this to take effect.

## Project structure

- `src/lib/gameLogic.ts` — pure, unit-tested tick function (speed/gear
  physics, events, hazard/crash minigame, weather/terrain effects)
- `src/lib/{vehicles,maps,gearTable,terrain,weather}.ts` — game data/config
- `src/store/useGameStore.ts` — zustand store wiring the pure logic to React
- `src/components/RaceCanvas.tsx` — Canvas 2D pixel-art race renderer
- `src/components/screens/*` — map/vehicle select, race, result screens
