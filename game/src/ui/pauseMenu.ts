import { COLORS } from "../colors";
import {
  drawDimOverlay,
  drawPanel,
  drawPixelButton,
  hitTestButton,
  type PixelButtonRect,
} from "./sharedButtons";

export type PauseButtonId = "resume" | "settings" | "leave";

const BUTTON_W = 120;
const BUTTON_H = 20;
const BUTTON_GAP = 8;

export function getPausePanelRect(w: number, h: number): { x: number; y: number; w: number; h: number } {
  const pw = 200;
  const ph = 118;
  return { x: (w - pw) / 2, y: (h - ph) / 2, w: pw, h: ph };
}

export function getPauseButtonRects(w: number, h: number): readonly PixelButtonRect[] {
  const panel = getPausePanelRect(w, h);
  const x = panel.x + (panel.w - BUTTON_W) / 2;
  let y = panel.y + 38;
  const buttons: PixelButtonRect[] = [];
  for (const id of ["resume", "settings", "leave"] as const) {
    buttons.push({ id, x, y, w: BUTTON_W, h: BUTTON_H });
    y += BUTTON_H + BUTTON_GAP;
  }
  return buttons;
}

export function hitTestPauseButton(
  x: number,
  y: number,
  w: number,
  h: number,
): PauseButtonId | null {
  const hit = hitTestButton(x, y, getPauseButtonRects(w, h));
  return hit as PauseButtonId | null;
}

export function drawPauseMenu(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  hovered: PauseButtonId | null,
): void {
  drawDimOverlay(ctx, w, h);
  const panel = getPausePanelRect(w, h);
  drawPanel(ctx, panel.x, panel.y, panel.w, panel.h);

  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = COLORS.text;
  ctx.fillText("PAUSED", w / 2, panel.y + 18);
  ctx.font = "8px monospace";
  ctx.globalAlpha = 0.75;
  ctx.fillText("Press P to resume", w / 2, panel.y + 30);
  ctx.globalAlpha = 1;

  const labels: Record<PauseButtonId, string> = {
    resume: "RESUME",
    settings: "SETTINGS",
    leave: "LEAVE GAME",
  };

  for (const btn of getPauseButtonRects(w, h)) {
    drawPixelButton(ctx, btn, labels[btn.id as PauseButtonId], btn.id === hovered);
  }
}
