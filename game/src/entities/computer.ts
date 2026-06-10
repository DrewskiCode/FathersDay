import { COLORS } from "../colors";
import type { ComputerVisualState } from "./computerState";

/** Desk footprint (monitor + surface + chair). */
export const DESK_W = 16;
export const DESK_H = 14;

const SCREEN = { dx: 5, dy: 2, w: 6, h: 4 };

function drawScreen(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  state: ComputerVisualState,
  animTime: number,
): void {
  const sx = px + SCREEN.dx;
  const sy = py + SCREEN.dy;

  if (state === "working") {
    const glow = Math.floor(animTime * 1.5) % 2 === 0;
    ctx.fillStyle = glow ? COLORS.screenGlow : COLORS.screen;
    ctx.fillRect(sx, sy, SCREEN.w, SCREEN.h);
    if (glow) {
      ctx.fillStyle = COLORS.screenGlowBright;
      ctx.fillRect(sx + 2, sy + 1, 2, 2);
    }
    return;
  }

  ctx.fillStyle = COLORS.monitorScreen;
  ctx.fillRect(sx, sy, SCREEN.w, SCREEN.h);

  const showYellow = state === "fireYellow" || state === "fireOrange" || state === "fireRed";
  const showOrange = state === "fireOrange" || state === "fireRed";
  const showRed = state === "fireRed";
  const flicker = Math.floor(animTime * 8) % 2 === 0;

  if (showYellow) {
    ctx.fillStyle = flicker ? COLORS.fireYellow : COLORS.monitorScreen;
    ctx.fillRect(sx + 1, sy + 2, 2, 2);
    ctx.fillRect(sx + 3, sy + 1, 2, 1);
  }
  if (showOrange) {
    ctx.fillStyle = flicker ? COLORS.fireOrange : COLORS.fireYellow;
    ctx.fillRect(sx + 2, sy + 2, 3, 2);
    ctx.fillRect(sx, sy + 3, 2, 1);
  }
  if (showRed) {
    ctx.fillStyle = flicker ? COLORS.fireRed : COLORS.fireOrange;
    ctx.fillRect(sx + 1, sy + 1, 4, 3);
    ctx.fillRect(sx + 4, sy + 3, 1, 1);
    return;
  }

  const tick = Math.floor(animTime * 6);
  switch (state) {
    case "firePurple":
      ctx.fillStyle = tick % 2 ? COLORS.firePurple : COLORS.monitorScreen;
      ctx.fillRect(sx, sy, SCREEN.w, SCREEN.h);
      break;
    case "fireGreen":
      ctx.fillStyle = tick % 2 ? COLORS.fireGreen : COLORS.screenGlow;
      ctx.fillRect(sx, sy, SCREEN.w, SCREEN.h);
      break;
    case "fireWhite":
      ctx.fillStyle = COLORS.fireWhite;
      ctx.fillRect(sx, sy, SCREEN.w, SCREEN.h);
      break;
    case "fireRainbow": {
      const colors = [COLORS.fireRainbow1, COLORS.fireRainbow2, COLORS.fireRainbow3, COLORS.fireRainbow4];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = colors[(tick + i) % 4];
        ctx.fillRect(sx + (i % 2) * 3, sy + Math.floor(i / 2) * 2, 3, 2);
      }
      break;
    }
  }
}

export function drawComputerDesk(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  state: ComputerVisualState = "working",
  animTime = 0,
): void {
  const px = Math.round(x);
  const py = Math.round(y);

  ctx.fillStyle = COLORS.chair;
  ctx.fillRect(px + 1, py + 10, 5, 3);
  ctx.fillRect(px + 2, py + 8, 3, 3);

  ctx.fillStyle = COLORS.desk;
  ctx.fillRect(px + 1, py + 7, 14, 3);
  ctx.fillStyle = COLORS.deskDark;
  ctx.fillRect(px + 3, py + 10, 3, 4);
  ctx.fillRect(px + 10, py + 10, 3, 4);

  ctx.fillStyle = COLORS.computer;
  ctx.fillRect(px + 4, py + 1, 8, 6);

  drawScreen(ctx, px, py, state, animTime);
}
