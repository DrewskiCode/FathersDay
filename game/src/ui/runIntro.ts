import { COLORS } from "../colors";
import { drawPeacefulExterior } from "./gameOverExterior";

const EXTERIOR_HOLD = 1.6;
const TRANSITION = 1.4;
const COUNTDOWN_START = EXTERIOR_HOLD + TRANSITION;
const BEAT = 0.9;
const FIRE_BEAT = 0.75;

export class RunIntroSequence {
  time = 0;

  reset(): void {
    this.time = 0;
  }

  update(dt: number): boolean {
    this.time += dt;
    const total = COUNTDOWN_START + BEAT * 3 + FIRE_BEAT;
    return this.time >= total;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    drawOffice: () => void,
  ): void {
    const t = this.time;

    if (t < COUNTDOWN_START) {
      const transitionT = Math.max(0, t - EXTERIOR_HOLD) / TRANSITION;
      const zoom = 1 + transitionT * 0.55;
      const interiorAlpha = transitionT * transitionT;
      const exteriorAlpha = 1 - transitionT;

      if (interiorAlpha > 0.02) {
        ctx.save();
        ctx.globalAlpha = interiorAlpha;
        drawOffice();
        ctx.restore();
      }

      if (exteriorAlpha > 0.02) {
        ctx.save();
        ctx.translate(w / 2, h * 0.42);
        ctx.scale(zoom, zoom);
        ctx.translate(-w / 2, -h * 0.42);
        drawPeacefulExterior(ctx, w, h, exteriorAlpha, 0);
        ctx.restore();
      }

      if (transitionT > 0.05 && transitionT < 0.95) {
        ctx.fillStyle = COLORS.black;
        ctx.globalAlpha = transitionT * 0.25 * (1 - transitionT);
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
      }
      return;
    }

    drawOffice();

    const countT = t - COUNTDOWN_START;
    const label = countdownLabel(countT);
    if (!label) return;

    ctx.fillStyle = COLORS.bezelDark;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(w / 2 - 52, h / 2 - 28, 104, 44);
    ctx.globalAlpha = 1;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = label === "FIRE!" ? "bold 22px monospace" : "bold 28px monospace";
    ctx.fillStyle = label === "FIRE!" ? COLORS.fireRed : COLORS.fireYellow;
    ctx.fillText(label, w / 2, h / 2 - 6);
  }
}

function countdownLabel(countT: number): string | null {
  if (countT < BEAT) return "3";
  if (countT < BEAT * 2) return "2";
  if (countT < BEAT * 3) return "1";
  if (countT < BEAT * 3 + FIRE_BEAT) return "FIRE!";
  return null;
}
