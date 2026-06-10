import { COLORS } from "../colors";
import type { GameSettings } from "../systems/settings";
import {
  drawDimOverlay,
  drawPanel,
  drawPixelButton,
  hitTestButton,
  type PixelButtonRect,
} from "./sharedButtons";

export type SettingsAction =
  | { type: "back" }
  | { type: "toggleMusic" }
  | { type: "setMusicVolume"; value: number }
  | { type: "setSfxVolume"; value: number };

export type SettingsHit = SettingsAction["type"] | "musicBar" | "sfxBar";

const PANEL_W = 248;
const PANEL_H = 156;
const BAR_X = 88;
const BAR_W = 120;
const BAR_H = 10;

export function getSettingsPanelRect(w: number, h: number): { x: number; y: number; w: number; h: number } {
  return { x: (w - PANEL_W) / 2, y: (h - PANEL_H) / 2, w: PANEL_W, h: PANEL_H };
}

function getBackButton(w: number, h: number): PixelButtonRect {
  const panel = getSettingsPanelRect(w, h);
  return {
    id: "back",
    x: panel.x + (panel.w - 72) / 2,
    y: panel.y + panel.h - 28,
    w: 72,
    h: 20,
  };
}

function getMusicToggleButton(w: number, h: number): PixelButtonRect {
  const panel = getSettingsPanelRect(w, h);
  return {
    id: "toggleMusic",
    x: panel.x + 168,
    y: panel.y + 44,
    w: 52,
    h: 18,
  };
}

function musicBarRect(w: number, h: number): { x: number; y: number; w: number; h: number } {
  const panel = getSettingsPanelRect(w, h);
  return { x: panel.x + BAR_X, y: panel.y + 72, w: BAR_W, h: BAR_H };
}

function sfxBarRect(w: number, h: number): { x: number; y: number; w: number; h: number } {
  const panel = getSettingsPanelRect(w, h);
  return { x: panel.x + BAR_X, y: panel.y + 100, w: BAR_W, h: BAR_H };
}

export function hitTestSettings(
  x: number,
  y: number,
  w: number,
  h: number,
): SettingsHit | null {
  if (hitTestButton(x, y, [getBackButton(w, h)]) === "back") return "back";
  if (hitTestButton(x, y, [getMusicToggleButton(w, h)]) === "toggleMusic") {
    return "toggleMusic";
  }

  const musicBar = musicBarRect(w, h);
  if (
    x >= musicBar.x &&
    x < musicBar.x + musicBar.w &&
    y >= musicBar.y &&
    y < musicBar.y + musicBar.h
  ) {
    return "musicBar";
  }

  const sfxBar = sfxBarRect(w, h);
  if (
    x >= sfxBar.x &&
    x < sfxBar.x + sfxBar.w &&
    y >= sfxBar.y &&
    y < sfxBar.y + sfxBar.h
  ) {
    return "sfxBar";
  }

  return null;
}

function volumeFromBar(x: number, bar: { x: number; w: number }): number {
  return Math.max(0, Math.min(1, (x - bar.x) / bar.w));
}

export function resolveSettingsClick(
  x: number,
  y: number,
  w: number,
  h: number,
): SettingsAction | null {
  const hit = hitTestSettings(x, y, w, h);
  if (!hit) return null;
  if (hit === "back") return { type: "back" };
  if (hit === "toggleMusic") return { type: "toggleMusic" };
  if (hit === "musicBar") {
    return { type: "setMusicVolume", value: volumeFromBar(x, musicBarRect(w, h)) };
  }
  if (hit === "sfxBar") {
    return { type: "setSfxVolume", value: volumeFromBar(x, sfxBarRect(w, h)) };
  }
  return null;
}

function drawVolumeBar(
  ctx: CanvasRenderingContext2D,
  bar: { x: number; y: number; w: number; h: number },
  value: number,
  enabled: boolean,
): void {
  ctx.fillStyle = COLORS.bezelDark;
  ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
  const fillW = Math.round(bar.w * value);
  ctx.fillStyle = enabled ? COLORS.buttonOn : COLORS.buttonOff;
  ctx.fillRect(bar.x, bar.y, fillW, bar.h);
  ctx.fillStyle = COLORS.bezelLight;
  ctx.fillRect(bar.x, bar.y, bar.w, 1);
}

export function drawSettingsPanel(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  settings: GameSettings,
  hovered: SettingsHit | null,
): void {
  drawDimOverlay(ctx, w, h);
  const panel = getSettingsPanelRect(w, h);
  drawPanel(ctx, panel.x, panel.y, panel.w, panel.h);

  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = COLORS.text;
  ctx.fillText("SETTINGS", w / 2, panel.y + 18);

  ctx.font = "9px monospace";
  ctx.textAlign = "left";
  ctx.fillText("MUSIC", panel.x + 16, panel.y + 53);
  ctx.fillText("MUSIC VOL", panel.x + 16, panel.y + 77);
  ctx.fillText("SFX VOL", panel.x + 16, panel.y + 105);

  const toggle = getMusicToggleButton(w, h);
  drawPixelButton(
    ctx,
    toggle,
    settings.musicEnabled ? "ON" : "OFF",
    hovered === "toggleMusic",
  );

  drawVolumeBar(ctx, musicBarRect(w, h), settings.musicVolume, settings.musicEnabled);
  drawVolumeBar(ctx, sfxBarRect(w, h), settings.sfxVolume, true);

  drawPixelButton(ctx, getBackButton(w, h), "BACK", hovered === "back");
}
