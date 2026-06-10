import { COLORS } from "../colors";
import { VIEW_W, WALL_THICK } from "../constants";
import type { ExtinguisherAmmo } from "../extinguisherAmmo";
import type { PowerUpState } from "../systems/powerUps";
import type { ScoreManager } from "../systems/score";
import type { ComboState } from "../systems/combo";
import type { CollectiblesManager } from "../systems/collectibles";
import type { FireSpawnSystem } from "../systems/fireSpawn";
import { wingExplorePrompt, wingExploreSide } from "../systems/rounds";
import { drawOfficeScoreHud } from "./scoreHud";

export type GameplayHudState = {
  round: number;
  score: ScoreManager;
  ammo: ExtinguisherAmmo;
  powerUps: PowerUpState;
  combo: ComboState;
  collectibles: CollectiblesManager;
  nearStation: boolean;
  fireSpawn: FireSpawnSystem;
  roundBannerRound: number | null;
  currentRoom: "left" | "center" | "right" | "tutorial";
  animTime: number;
};

export function drawGameplayHud(ctx: CanvasRenderingContext2D, hud: GameplayHudState): void {
  const hudInset = WALL_THICK + 2;
  const scoreY = WALL_THICK;

  drawOfficeScoreHud(ctx, WALL_THICK, scoreY, hud.score, hud.combo);

  // Top-right round — inset from wall edge
  const rightX = VIEW_W - hudInset;
  ctx.textAlign = "right";
  ctx.font = "10px monospace";
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`RND ${hud.round}`, rightX, scoreY + 2);

  // Power-up timers
  let rightTimerY = scoreY + 14;
  ctx.font = "8px monospace";
  ctx.textAlign = "right";
  if (hud.powerUps.hasUnlimitedSpray) {
    ctx.fillStyle = COLORS.firePurple;
    ctx.fillText(`SPRAY ${Math.ceil(hud.powerUps.unlimitedSpray)}s`, rightX, rightTimerY);
    rightTimerY += 10;
  }
  if (hud.powerUps.hasGhostWalls) {
    ctx.fillStyle = COLORS.fireWhite;
    ctx.fillText(`GHOST ${Math.ceil(hud.powerUps.ghostWalls)}s`, rightX, rightTimerY);
    rightTimerY += 10;
  }
  if (hud.collectibles.hasCoffeeBoost) {
    ctx.fillStyle = COLORS.coffee;
    ctx.fillText(
      `COFFEE ${Math.ceil(hud.collectibles.coffeeBoostRemaining)}s`,
      rightX,
      rightTimerY,
    );
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.font = "10px monospace";
  ctx.fillStyle = COLORS.text;
  const usesLabel = hud.ammo.unlimitedSpray ? "USES ∞" : `USES ${hud.ammo.uses}/${hud.ammo.maxUses}`;
  ctx.fillText(usesLabel, 8, 234);

  if (hud.powerUps.banner && hud.powerUps.bannerRemaining > 0) {
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = COLORS.fireYellow;
    ctx.fillText(hud.powerUps.banner, VIEW_W / 2, 72);
  }

  if (hud.roundBannerRound !== null) {
    const label = `ROUND ${hud.roundBannerRound}`;
    ctx.font = "bold 12px monospace";
    const textW = Math.ceil(ctx.measureText(label).width);
    const boxPadX = 12;
    const boxW = Math.min(textW + boxPadX * 2, VIEW_W - hudInset * 2);
    const boxH = 26;
    const boxX = (VIEW_W - boxW) / 2;
    const boxY = 105;

    ctx.fillStyle = COLORS.bezelDark;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.globalAlpha = 1;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = COLORS.text;
    ctx.fillText(label, VIEW_W / 2, 118);
  }

  if (hud.fireSpawn.unlockBannerRemaining > 0 && hud.fireSpawn.unlockBannerText) {
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = COLORS.screenGlow;
    ctx.fillText(hud.fireSpawn.unlockBannerText, VIEW_W / 2, 88);
  }

  if (hud.currentRoom === "center" && hud.fireSpawn.showExplorePrompt) {
    const side = wingExploreSide(hud.round);
    if (side) {
      const prompt = wingExplorePrompt(side);
      const arrow = side === "left" ? "←" : "→";
      const blink = Math.floor(hud.animTime * 2.5) % 2 === 0;
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = blink ? COLORS.fireYellow : COLORS.text;
      ctx.fillText(`${arrow} ${prompt} ${arrow}`, VIEW_W / 2, 132);
    }
  }

  if (hud.ammo.isReloading) {
    drawReloadBar(ctx, hud.ammo.reloadProgress);
    return;
  }

  drawExtinguisherBottomHints(ctx, hud.ammo, hud.nearStation, {
    showSprayHint: true,
  });
}

export function drawReloadBar(ctx: CanvasRenderingContext2D, progress: number): void {
  const barW = 96;
  const barH = 8;
  const x = (VIEW_W - barW) / 2;
  const y = 206;

  ctx.fillStyle = COLORS.bezelDark;
  ctx.fillRect(x - 1, y - 1, barW + 2, barH + 2);

  ctx.fillStyle = COLORS.buttonOff;
  ctx.fillRect(x, y, barW, barH);

  ctx.fillStyle = COLORS.buttonOn;
  ctx.fillRect(x, y, Math.floor(barW * progress), barH);

  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = COLORS.text;
  ctx.fillText("Reloading...", VIEW_W / 2, y - 4);
}

/** Bottom-center extinguisher prompts (reload bar, R / Space hints). */
export function drawExtinguisherBottomHints(
  ctx: CanvasRenderingContext2D,
  ammo: ExtinguisherAmmo,
  nearStation: boolean,
  options: { showSprayHint?: boolean } = {},
): void {
  if (ammo.isReloading) {
    drawReloadBar(ctx, ammo.reloadProgress);
    return;
  }

  if (nearStation && !ammo.isBusy && !ammo.unlimitedSpray) {
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = COLORS.text;
    ctx.globalAlpha = 0.9;
    ctx.fillText("Press R to reload", VIEW_W / 2, 218);
    ctx.globalAlpha = 1;
  } else if (
    options.showSprayHint &&
    (ammo.uses > 0 || ammo.unlimitedSpray) &&
    !ammo.isBusy
  ) {
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = COLORS.text;
    ctx.globalAlpha = 0.65;
    ctx.fillText("Space to spray", VIEW_W / 2, 218);
    ctx.globalAlpha = 1;
  }
}
