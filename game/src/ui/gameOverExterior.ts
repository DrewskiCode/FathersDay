import { COLORS } from "../colors";
import { drawOfficeHudPanel } from "./scoreHud";
import { gameAudio } from "../audio/sound";

const HIGH_SCORE_KEY = "pyro-pyro-high-score";

export function loadHighScore(): number {
  try {
    return Number(sessionStorage.getItem(HIGH_SCORE_KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(score: number): number {
  const prev = loadHighScore();
  const best = Math.max(prev, score);
  try {
    sessionStorage.setItem(HIGH_SCORE_KEY, String(best));
  } catch {
    /* ignore */
  }
  return best;
}

export type GameOverChoice = "menu" | "again";

export type GameOverButtonId = GameOverChoice;

const GAME_OVER_BUTTON_W = 92;
const GAME_OVER_BUTTON_H = 20;
const GAME_OVER_BUTTON_GAP = 10;
const MENU_SHOW_AT = 6.5;

export type GameOverButtonRect = {
  id: GameOverButtonId;
  x: number;
  y: number;
  w: number;
  h: number;
};

export function getGameOverButtonRects(w: number, h: number): readonly GameOverButtonRect[] {
  const y = h - 30;
  const totalW = GAME_OVER_BUTTON_W * 2 + GAME_OVER_BUTTON_GAP;
  const leftX = (w - totalW) / 2;
  return [
    { id: "menu", x: leftX, y, w: GAME_OVER_BUTTON_W, h: GAME_OVER_BUTTON_H },
    { id: "again", x: leftX + GAME_OVER_BUTTON_W + GAME_OVER_BUTTON_GAP, y, w: GAME_OVER_BUTTON_W, h: GAME_OVER_BUTTON_H },
  ];
}

export function hitTestGameOverButton(
  x: number,
  y: number,
  w: number,
  h: number,
): GameOverButtonId | null {
  for (const btn of getGameOverButtonRects(w, h)) {
    if (x >= btn.x && x < btn.x + btn.w && y >= btn.y && y < btn.y + btn.h) {
      return btn.id;
    }
  }
  return null;
}

export function drawGameOverButtons(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  hovered: GameOverButtonId | null,
  alpha: number,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  for (const btn of getGameOverButtonRects(w, h)) {
    const active = btn.id === hovered;
    ctx.fillStyle = active ? COLORS.buttonOn : COLORS.buttonOff;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.fillStyle = active ? COLORS.buttonGlow : COLORS.buttonPlate;
    ctx.fillRect(btn.x + 2, btn.y + 2, btn.w - 4, btn.h - 4);
    ctx.font = active ? "bold 10px monospace" : "10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = COLORS.text;
    const label = btn.id === "menu" ? "MENU" : "PLAY AGAIN";
    ctx.fillText(label, btn.x + btn.w / 2, btn.y + btn.h / 2);
  }
  ctx.restore();
}

export type GameOverPointer = {
  mouseX: number | null;
  mouseY: number | null;
  clickX: number | null;
  clickY: number | null;
  canvasW: number;
  canvasH: number;
};

function shakeOffset(t: number): { x: number; y: number } {
  if (t < 0.03) return { x: 0, y: 0 };
  const decay = Math.max(0, 1 - (t - 0.03) / 2.2);
  if (decay <= 0) return { x: 0, y: 0 };
  const amp = 10 * decay;
  const freq = 48 + t * 20;
  return {
    x: Math.sin(t * freq) * amp + Math.sin(t * freq * 2.3) * amp * 0.4,
    y: Math.cos(t * freq * 1.1) * amp * 0.7,
  };
}

function impactFlashAlpha(explodeT: number): number {
  if (explodeT < 0.04) return 1;
  if (explodeT < 0.07) return 0;
  if (explodeT < 0.1) return 0.85;
  if (explodeT < 0.14) return 0;
  if (explodeT < 0.17) return 0.55;
  if (explodeT < 0.22) return 0;
  return 0;
}

/** Timed exterior nuke sequence with shake and menu. */
export class GameOverSequence {
  private time = 0;
  private explosionSoundPlayed = false;
  private readonly bestScore: number;

  constructor(
    readonly score: number,
    readonly round: number,
  ) {
    this.bestScore = saveHighScore(score);
  }

  reset(): void {
    this.time = 0;
    this.explosionSoundPlayed = false;
  }

  menuVisible(): boolean {
    return this.time >= MENU_SHOW_AT;
  }

  update(dt: number, pointer: GameOverPointer): GameOverChoice | null {
    this.time += dt;

    if (!this.menuVisible()) return null;

    if (pointer.clickX !== null && pointer.clickY !== null) {
      return hitTestGameOverButton(
        pointer.clickX,
        pointer.clickY,
        pointer.canvasW,
        pointer.canvasH,
      );
    }
    return null;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    hovered: GameOverButtonId | null,
  ): void {
    const t = this.time;
    const explodeT = Math.max(0, t - 2.0);
    if (explodeT > 0.03 && !this.explosionSoundPlayed) {
      this.explosionSoundPlayed = true;
      gameAudio.explosionHit();
    }
    const shake = shakeOffset(explodeT);

    ctx.save();
    ctx.translate(Math.round(shake.x), Math.round(shake.y));

    const fadeIn = Math.min(1, t / 1.2);
    drawPeacefulExterior(ctx, w, h, fadeIn, explodeT);

    if (explodeT > 0) {
      drawNukeExplosion(ctx, w, h, explodeT);
    }

    ctx.restore();

    const flash = impactFlashAlpha(explodeT);
    if (flash > 0) {
      ctx.fillStyle = explodeT < 0.08 ? COLORS.foamLight : COLORS.fireOrange;
      ctx.globalAlpha = flash;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }

    const scoreAlpha = Math.min(1, Math.max(0, (t - 4.2) / 1.2));
    if (scoreAlpha > 0) {
      drawScoreBlock(ctx, w, h, this.score, this.bestScore, this.round, scoreAlpha);
    }

    const menuAlpha = Math.min(1, Math.max(0, (t - MENU_SHOW_AT) / 0.8));
    if (menuAlpha > 0) {
      drawGameOverButtons(ctx, w, h, hovered, menuAlpha);
    }
  }
}

export function drawPeacefulExterior(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  alpha: number,
  explodeT: number,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = COLORS.sky;
  ctx.fillRect(0, 0, w, h * 0.55);

  ctx.fillStyle = COLORS.grass;
  ctx.fillRect(0, h * 0.55, w, h * 0.45);
  ctx.fillStyle = COLORS.grassDark;
  for (let i = 0; i < 20; i++) {
    ctx.fillRect((i * 19) % w, h * 0.55 + (i % 3) * 4, 12, 3);
  }

  const bx = w / 2 - 70;
  const by = h * 0.28;
  const bw = 140;
  const bh = 90;
  const obliterate = Math.min(1, Math.max(0, (explodeT - 0.08) / 0.35));

  if (obliterate < 1) {
    ctx.globalAlpha = alpha * (1 - obliterate);

    ctx.fillStyle = COLORS.grassDark;
    ctx.fillRect(bx + 8, by + bh, bw, 8);

    ctx.fillStyle = COLORS.building;
    ctx.fillRect(bx, by + 20, bw, bh - 20);
    ctx.fillStyle = COLORS.buildingLight;
    ctx.fillRect(bx + 4, by + 24, bw - 8, 6);
    ctx.fillRect(bx - 28, by + 36, 32, bh - 36);
    ctx.fillRect(bx + bw - 4, by + 36, 32, bh - 36);
    ctx.fillRect(bx + 44, by, 52, 28);

    ctx.fillStyle = COLORS.buildingWindow;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        ctx.fillRect(bx + 16 + col * 22, by + 34 + row * 16, 10, 8);
      }
    }
    ctx.fillRect(bx - 18, by + 50, 8, 6);
    ctx.fillRect(bx + bw + 6, by + 50, 8, 6);
    ctx.fillStyle = COLORS.buildingDoor;
    ctx.fillRect(bx + 62, by + bh - 22, 16, 18);

    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.text;
    ctx.fillText("PYRO OFFICE", w / 2, by + bh + 18);
  }

  ctx.restore();
}

function drawNukeExplosion(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
): void {
  const cx = w / 2;
  const groundY = h * 0.55;
  const baseY = h * 0.45;

  ctx.save();

  if (t > 0.06) {
    const scorchW = Math.min(w, 40 + t * 180);
    ctx.fillStyle = COLORS.fireOrange;
    ctx.globalAlpha = Math.min(0.7, (t - 0.06) * 1.5) * Math.max(0, 1 - t / 3);
    ctx.fillRect(cx - scorchW / 2, groundY - 6, scorchW, 10);
    ctx.fillStyle = COLORS.fireRed;
    ctx.fillRect(cx - scorchW * 0.3, groundY - 4, scorchW * 0.6, 6);
  }

  const ballT = Math.max(0, t - 0.05);
  const ballR = 8 + ballT * 70;
  if (ballT > 0 && ballT < 2.5) {
    for (let ring = 0; ring < 5; ring++) {
      const r = ballR - ring * 14;
      if (r <= 0) continue;
      const colors = [COLORS.foamLight, COLORS.fireYellow, COLORS.fireOrange, COLORS.fireRed, COLORS.smoke];
      ctx.fillStyle = colors[ring] ?? COLORS.smoke;
      ctx.globalAlpha = Math.max(0, 0.85 - ballT * 0.3 - ring * 0.12);
      ctx.beginPath();
      ctx.arc(cx, baseY, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const stemT = Math.max(0, t - 0.15);
  if (stemT > 0 && stemT < 4) {
    const stemH = Math.min(h * 0.35, stemT * 120);
    const stemW = 18 + stemT * 8;
    ctx.fillStyle = COLORS.smoke;
    ctx.globalAlpha = Math.min(0.75, stemT * 0.5) * Math.max(0.3, 1 - stemT / 4);
    ctx.fillRect(cx - stemW / 2, baseY - stemH, stemW, stemH);
    ctx.fillStyle = COLORS.fireOrange;
    ctx.globalAlpha *= 0.5;
    ctx.fillRect(cx - stemW / 4, baseY - stemH * 0.7, stemW / 2, stemH * 0.7);
  }

  const capT = Math.max(0, t - 0.35);
  if (capT > 0 && capT < 4.5) {
    const capY = baseY - Math.min(h * 0.38, capT * 100) - 20;
    const capW = 30 + capT * 55;
    const capH = 16 + capT * 20;
    ctx.fillStyle = COLORS.fireRed;
    ctx.globalAlpha = Math.min(0.8, capT * 0.45) * Math.max(0.2, 1 - capT / 5);
    ctx.fillRect(cx - capW / 2, capY, capW, capH);
    ctx.fillStyle = COLORS.fireOrange;
    ctx.fillRect(cx - capW / 2 + 8, capY + 4, capW - 16, capH - 8);
    ctx.fillStyle = COLORS.smoke;
    ctx.globalAlpha *= 0.6;
    ctx.fillRect(cx - capW / 2 - 10, capY - 8, capW + 20, 12);
  }

  const waveT = Math.max(0, t - 0.12);
  if (waveT > 0 && waveT < 1.8) {
    const waveR = waveT * 160;
    ctx.strokeStyle = COLORS.foamLight;
    ctx.lineWidth = 3;
    ctx.globalAlpha = Math.max(0, 0.8 - waveT * 0.5);
    ctx.beginPath();
    ctx.arc(cx, baseY, waveR, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (t > 1) {
    ctx.fillStyle = COLORS.smoke;
    ctx.globalAlpha = Math.min(0.55, (t - 1) * 0.3);
    ctx.fillRect(cx - 35 - t * 5, 0, 70 + t * 10, h * 0.5);
  }

  ctx.restore();
}

function drawScoreBlock(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  score: number,
  best: number,
  round: number,
  alpha: number,
): void {
  ctx.save();
  const cx = w / 2;
  const boxW = 180;
  const boxH = 72;
  const boxX = cx - boxW / 2;
  const boxY = h / 2 - 8;

  ctx.globalAlpha = alpha * 0.5;
  drawOfficeHudPanel(ctx, boxX, boxY, boxW, boxH);
  ctx.globalAlpha = alpha;

  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 14px monospace";
  ctx.fillText("SCORE", cx, h / 2 + 8);
  ctx.font = "bold 24px monospace";
  ctx.fillStyle = COLORS.fireYellow;
  ctx.fillText(String(score), cx, h / 2 + 34);
  ctx.font = "10px monospace";
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`HIGH SCORE ${best}  ·  Round ${round}`, cx, h / 2 + 52);

  ctx.restore();
}
