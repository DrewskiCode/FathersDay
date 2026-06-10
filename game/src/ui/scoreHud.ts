import { COLORS } from "../colors";
import type { ComboState } from "../systems/combo";
import type { ScoreManager } from "../systems/score";

const SCORE_ONLY_W = 68;
const SCORE_COMBO_W = 124;
const BOX_H = 32;
const BOX_H_PULSE = 36;
const SCORE_COL_W = 56;
const PAD = 5;
export const SCORE_HUD_PANEL_OPACITY = 0.25;

/** Simple office HUD panel — bezel frame with muted screen fill. */
export function drawOfficeHudPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.fillStyle = COLORS.bezelDark;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = COLORS.bezel;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);

  ctx.fillStyle = COLORS.monitorScreen;
  const innerAlpha = ctx.globalAlpha;
  ctx.globalAlpha = innerAlpha * 0.4;
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  ctx.globalAlpha = innerAlpha;

  ctx.fillStyle = COLORS.bezelLight;
  ctx.fillRect(x + 1, y + 1, w - 2, 1);
}

function drawColumnDivider(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
): void {
  const divX = x + SCORE_COL_W;
  ctx.fillStyle = COLORS.bezelDark;
  ctx.fillRect(divX, y + 5, 1, h - 8);
  ctx.fillStyle = COLORS.bezelLight;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(divX + 1, y + 5, 1, h - 8);
  ctx.globalAlpha = 1;
}

export function drawOfficeScoreHud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  score: ScoreManager,
  combo: ComboState,
): void {
  const pulse = score.pulseRemaining > 0;
  const showCombo = combo.isWindowActive;
  const boxW = showCombo ? SCORE_COMBO_W : SCORE_ONLY_W;
  const boxH = pulse ? BOX_H_PULSE : BOX_H;

  ctx.save();
  ctx.globalAlpha = SCORE_HUD_PANEL_OPACITY;
  drawOfficeHudPanel(ctx, x, y, boxW, boxH);
  if (showCombo) {
    drawColumnDivider(ctx, x, y, boxH);
  }
  ctx.restore();

  const labelY = y + 5;
  const valueY = y + 15;
  const scoreX = x + PAD;

  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  ctx.font = "7px monospace";
  ctx.fillStyle = COLORS.text;
  ctx.globalAlpha = 0.65;
  ctx.fillText("SCORE", scoreX, labelY);
  ctx.globalAlpha = 1;

  ctx.font = pulse ? "bold 12px monospace" : "11px monospace";
  ctx.fillStyle = pulse ? COLORS.fireYellow : COLORS.text;
  ctx.fillText(`${score.value}`, scoreX, valueY);
  if (pulse && score.lastGain > 0) {
    ctx.font = "8px monospace";
    ctx.fillStyle = COLORS.screenGlow;
    const gainX = scoreX + ctx.measureText(`${score.value}`).width + 4;
    ctx.fillText(`+${score.lastGain}`, gainX, valueY + 1);
  }

  if (showCombo) {
    const comboX = x + SCORE_COL_W + PAD;
    const comboRight = x + boxW - PAD;
    const timerSec = Math.ceil(combo.windowRemaining);
    const streak = combo.streak;
    const mult = combo.multiplier().toFixed(1);

    ctx.font = "7px monospace";
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = COLORS.text;
    ctx.fillText("COMBO", comboX, labelY);
    ctx.globalAlpha = 1;

    ctx.font = "bold 8px monospace";
    ctx.fillStyle = streak >= 2 ? COLORS.fireOrange : COLORS.fireYellow;
    if (streak >= 2) {
      ctx.fillText(`x${streak}  ${mult}x`, comboX, valueY);
    }

    ctx.textAlign = "right";
    ctx.font = "8px monospace";
    ctx.fillStyle = timerSec <= 2 ? COLORS.fireRed : COLORS.screenGlow;
    ctx.fillText(`${timerSec}s`, comboRight, valueY);
    ctx.textAlign = "left";
  }
}
