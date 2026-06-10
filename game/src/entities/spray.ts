import { COLORS } from "../colors";
import { SPRAY_DURATION_SEC } from "../constants";
import type { Facing } from "./player";
import type { Player } from "./player";

export class ExtinguisherSpray {
  active = false;
  elapsed = 0;
  extinguishedTarget = false;

  reset(): void {
    this.active = false;
    this.elapsed = 0;
    this.extinguishedTarget = false;
  }

  start(): void {
    this.active = true;
    this.elapsed = 0;
    this.extinguishedTarget = false;
  }

  get isSpraying(): boolean {
    return this.active;
  }

  get progress(): number {
    return Math.min(1, this.elapsed / SPRAY_DURATION_SEC);
  }

  update(dt: number): void {
    if (!this.active) return;
    this.elapsed += dt;
    if (this.elapsed >= SPRAY_DURATION_SEC) {
      this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D, player: Player): void {
    if (!this.active) return;

    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    const t = this.progress;
    const facing = player.facing;

    ctx.globalAlpha = 0.85;
    drawFoamCone(ctx, px, py, facing, t);
    ctx.globalAlpha = 1;
  }
}

function drawFoamCone(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  facing: Facing,
  t: number,
): void {
  const reach = 8 + t * 36;
  const spread = 4 + t * 10;
  const blobs = 6;

  for (let i = 0; i < blobs; i++) {
    const phase = (i / blobs + t * 2) % 1;
    let bx = px;
    let by = py;

    switch (facing) {
      case "right":
        bx += 6 + reach * phase;
        by += (i - blobs / 2) * (spread / blobs) * phase;
        break;
      case "left":
        bx -= 6 + reach * phase;
        by += (i - blobs / 2) * (spread / blobs) * phase;
        break;
      case "down":
        by += 6 + reach * phase;
        bx += (i - blobs / 2) * (spread / blobs) * phase;
        break;
      case "up":
        by -= 6 + reach * phase;
        bx += (i - blobs / 2) * (spread / blobs) * phase;
        break;
    }

    const size = 2 + (1 - phase) * 3;
    ctx.fillStyle = phase < 0.5 ? COLORS.foam : COLORS.foamLight;
    ctx.fillRect(Math.round(bx), Math.round(by), size, size);
  }

  ctx.fillStyle = COLORS.foam;
  switch (facing) {
    case "right":
      ctx.fillRect(Math.round(px + 8), Math.round(py - 1), Math.round(reach * 0.6), 3);
      break;
    case "left":
      ctx.fillRect(Math.round(px - 8 - reach * 0.6), Math.round(py - 1), Math.round(reach * 0.6), 3);
      break;
    case "down":
      ctx.fillRect(Math.round(px - 1), Math.round(py + 8), 3, Math.round(reach * 0.6));
      break;
    case "up":
      ctx.fillRect(Math.round(px - 1), Math.round(py - 8 - reach * 0.6), 3, Math.round(reach * 0.6));
      break;
  }
}
