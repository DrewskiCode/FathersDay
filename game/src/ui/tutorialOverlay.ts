import { COLORS } from "../colors";
import { VIEW_W, WALL_THICK } from "../constants";
import { DESK_W } from "../entities/computer";
import type { ExtinguisherAmmo } from "../extinguisherAmmo";
import type { ComboState } from "../systems/combo";
import type { CollectiblesManager } from "../systems/collectibles";
import type { ScoreManager } from "../systems/score";
import { getComputerSlots } from "../rooms/computers";
import type { TutorialPrompt, TutorialWalkthrough } from "../tutorial/walkthrough";
import { computerId } from "../entities/computerState";
import { drawExtinguisherBottomHints } from "./hud";
import { drawOfficeScoreHud } from "./scoreHud";

const PROMPT_PAD = 14;
const PROMPT_MIN_W = 140;
const PROMPT_MAX_W = 188;

export type TutorialOverlayState = {
  walkthrough: TutorialWalkthrough;
  prompt: TutorialPrompt;
  ammo: ExtinguisherAmmo;
  score: ScoreManager;
  combo: ComboState;
  collectibles: CollectiblesManager;
  animTime: number;
  nearStation: boolean;
  showSprayHint: boolean;
};

export function drawTutorialScoreHud(
  ctx: CanvasRenderingContext2D,
  score: ScoreManager,
  combo: ComboState,
  collectibles: CollectiblesManager,
): void {
  const scoreY = WALL_THICK;

  drawOfficeScoreHud(ctx, WALL_THICK, scoreY, score, combo);

  if (collectibles.hasCoffeeBoost) {
    ctx.textAlign = "right";
    ctx.font = "8px monospace";
    ctx.fillStyle = COLORS.coffee;
    ctx.fillText(
      `COFFEE ${Math.ceil(collectibles.coffeeBoostRemaining)}s`,
      VIEW_W - WALL_THICK - 2,
      scoreY + 2,
    );
    ctx.textAlign = "left";
  }
}

export function drawTutorialOverlay(
  ctx: CanvasRenderingContext2D,
  state: TutorialOverlayState,
): void {
  const { walkthrough, prompt, ammo, score, combo, collectibles, animTime, nearStation, showSprayHint } =
    state;
  const cfg = walkthrough.config();

  drawTutorialScoreHud(ctx, score, combo, collectibles);
  drawFloatingPrompt(ctx, prompt, walkthrough.promptAlpha(animTime));

  if (cfg.showStageLabels) {
    getComputerSlots("tutorial").forEach((slot, index) => {
      const id = computerId("tutorial", index);
      const label = walkthrough.deskLabel(id);
      if (!label) return;
      const flameAnchorY = slot.y + 1;
      const labelY = flameAnchorY - walkthrough.labelOffset(id);
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = COLORS.text;
      ctx.fillText(label, slot.x + DESK_W / 2, labelY);
    });
  }

  if (cfg.highlightPracticeDesk) {
    const slot = getComputerSlots("tutorial")[0]!;
    const pulse = Math.floor(animTime * 3) % 2 === 0;
    ctx.strokeStyle = pulse ? COLORS.fireYellow : COLORS.screenGlow;
    ctx.lineWidth = 1;
    ctx.strokeRect(slot.x - 2, slot.y - 2, DESK_W + 4, 18);
  }

  if (cfg.highlightStation) {
    const alcove = walkthrough.stationHighlightRect();
    const pulse = 0.35 + 0.25 * (0.5 + 0.5 * Math.sin(animTime * 3));
    ctx.fillStyle = COLORS.fireYellow;
    ctx.globalAlpha = pulse;
    ctx.fillRect(alcove.x, alcove.y, alcove.w, alcove.h);
    ctx.globalAlpha = 1;
    ctx.strokeStyle =
      Math.floor(animTime * 3) % 2 === 0 ? COLORS.fireYellow : COLORS.fireOrange;
    ctx.lineWidth = 1;
    ctx.strokeRect(alcove.x + 0.5, alcove.y + 0.5, alcove.w - 1, alcove.h - 1);

    const station = walkthrough.stationPosition();
    if (station) {
      ctx.fillStyle = COLORS.fireYellow;
      ctx.font = "12px monospace";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText("→", alcove.x - 4, station.y + 10);
    }
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.font = "10px monospace";
  ctx.fillStyle = COLORS.text;
  const usesLabel = ammo.unlimitedSpray ? "USES ∞" : `USES ${ammo.uses}/${ammo.maxUses}`;
  ctx.fillText(usesLabel, 8, 234);

  drawExtinguisherBottomHints(ctx, ammo, nearStation, { showSprayHint });
}

function drawFloatingPrompt(
  ctx: CanvasRenderingContext2D,
  prompt: TutorialPrompt,
  alpha: number,
): void {
  if (alpha <= 0.02) return;

  ctx.font = "bold 10px monospace";
  const mainW = ctx.measureText(prompt.main).width;
  ctx.font = "8px monospace";
  const hintW = prompt.hint ? ctx.measureText(prompt.hint).width : 0;

  const contentW = Math.max(mainW, hintW);
  const boxW = Math.min(PROMPT_MAX_W, Math.max(PROMPT_MIN_W, Math.ceil(contentW + PROMPT_PAD * 2)));
  const boxH = prompt.hint ? 30 : 18;
  const boxX = VIEW_W - WALL_THICK - boxW;
  const boxY = WALL_THICK;
  const textX = VIEW_W - WALL_THICK - PROMPT_PAD;

  ctx.save();
  ctx.globalAlpha = alpha * 0.82;
  ctx.fillStyle = COLORS.bezelDark;
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.globalAlpha = alpha * 0.35;
  ctx.strokeStyle = COLORS.bezelLight;
  ctx.lineWidth = 1;
  ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.font = "bold 10px monospace";
  ctx.fillStyle = COLORS.fireYellow;
  ctx.fillText(prompt.main, textX, boxY + (prompt.hint ? 10 : boxH / 2));

  if (prompt.hint) {
    ctx.font = "8px monospace";
    ctx.fillStyle = COLORS.text;
    ctx.fillText(prompt.hint, textX, boxY + 22);
  }
  ctx.restore();
}

export function drawTutorialFadeOut(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  fade: number,
): void {
  if (fade <= 0) return;
  ctx.fillStyle = COLORS.black;
  ctx.globalAlpha = Math.min(1, fade);
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
}
