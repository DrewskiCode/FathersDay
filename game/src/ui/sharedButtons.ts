import { COLORS } from "../colors";

export type PixelButtonRect = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export function drawPixelButton(
  ctx: CanvasRenderingContext2D,
  btn: PixelButtonRect,
  label: string,
  active: boolean,
): void {
  ctx.fillStyle = active ? COLORS.buttonOn : COLORS.buttonOff;
  ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
  ctx.fillStyle = active ? COLORS.buttonGlow : COLORS.buttonPlate;
  ctx.fillRect(btn.x + 2, btn.y + 2, btn.w - 4, btn.h - 4);
  ctx.font = active ? "bold 10px monospace" : "10px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = COLORS.text;
  ctx.fillText(label, btn.x + btn.w / 2, btn.y + btn.h / 2);
}

export function hitTestButton(
  x: number,
  y: number,
  buttons: readonly PixelButtonRect[],
): string | null {
  for (const btn of buttons) {
    if (x >= btn.x && x < btn.x + btn.w && y >= btn.y && y < btn.y + btn.h) {
      return btn.id;
    }
  }
  return null;
}

export function drawDimOverlay(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = COLORS.black;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
}

export function drawPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.fillStyle = COLORS.bezelDark;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = COLORS.bezel;
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  ctx.fillStyle = COLORS.bezelLight;
  ctx.fillRect(x + 4, y + 4, w - 8, 2);
}
