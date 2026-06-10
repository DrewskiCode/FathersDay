import { COLORS } from "../colors";
import type { Facing } from "./player";

/** Wall-mounted extinguisher + bracket. */
export function drawExtinguisher(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const px = Math.round(x);
  const py = Math.round(y);

  ctx.fillStyle = COLORS.wallDark;
  ctx.fillRect(px, py + 2, 8, 3);
  ctx.fillRect(px + 1, py + 5, 6, 2);

  ctx.fillStyle = COLORS.extinguisher;
  ctx.fillRect(px + 2, py + 7, 4, 10);
  ctx.fillStyle = COLORS.extinguisherDark;
  ctx.fillRect(px + 3, py + 8, 2, 8);

  ctx.fillStyle = COLORS.extinguisherNozzle;
  ctx.fillRect(px + 3, py + 5, 2, 3);
  ctx.fillRect(px + 5, py + 6, 3, 1);
}

/** Small extinguisher held in Pyro's hand. */
export function drawHandExtinguisher(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  facing: Facing,
): void {
  let hx = px;
  let hy = py;

  switch (facing) {
    case "right":
      hx = px + 9;
      hy = py + 8;
      ctx.fillStyle = COLORS.extinguisherNozzle;
      ctx.fillRect(hx + 5, hy + 1, 2, 1);
      ctx.fillStyle = COLORS.extinguisher;
      ctx.fillRect(hx, hy, 5, 3);
      ctx.fillStyle = COLORS.extinguisherDark;
      ctx.fillRect(hx + 1, hy + 3, 3, 4);
      break;
    case "left":
      hx = px - 1;
      hy = py + 8;
      ctx.fillStyle = COLORS.extinguisherNozzle;
      ctx.fillRect(hx, hy + 1, 2, 1);
      ctx.fillStyle = COLORS.extinguisher;
      ctx.fillRect(hx + 2, hy, 5, 3);
      ctx.fillStyle = COLORS.extinguisherDark;
      ctx.fillRect(hx + 3, hy + 3, 3, 4);
      break;
    case "down":
      hx = px + 8;
      hy = py + 11;
      ctx.fillStyle = COLORS.extinguisher;
      ctx.fillRect(hx, hy, 3, 4);
      ctx.fillStyle = COLORS.extinguisherDark;
      ctx.fillRect(hx, hy + 4, 3, 2);
      ctx.fillStyle = COLORS.extinguisherNozzle;
      ctx.fillRect(hx + 3, hy + 1, 2, 2);
      break;
    case "up":
      hx = px + 2;
      hy = py + 4;
      ctx.fillStyle = COLORS.extinguisher;
      ctx.fillRect(hx + 2, hy, 3, 4);
      ctx.fillStyle = COLORS.extinguisherDark;
      ctx.fillRect(hx + 3, hy + 4, 2, 2);
      ctx.fillStyle = COLORS.extinguisherNozzle;
      ctx.fillRect(hx + 4, hy - 1, 2, 2);
      break;
  }
}
