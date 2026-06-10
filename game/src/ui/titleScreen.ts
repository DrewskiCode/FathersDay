import { COLORS } from "../colors";

export type TitleButtonId = "play" | "tutorial";

const BUTTON_W = 92;
const BUTTON_H = 20;
const BUTTON_GAP = 10;
const GEAR_SIZE = 20;
const GEAR_PAD = 6;

export type TitleButtonRect = {
  id: TitleButtonId;
  x: number;
  y: number;
  w: number;
  h: number;
};

export function getTitleSettingsGearRect(w: number): { x: number; y: number; w: number; h: number } {
  return { x: w - GEAR_SIZE - GEAR_PAD, y: GEAR_PAD, w: GEAR_SIZE, h: GEAR_SIZE };
}

export function hitTestTitleSettingsGear(
  x: number,
  y: number,
  w: number,
): boolean {
  const gear = getTitleSettingsGearRect(w);
  return x >= gear.x && x < gear.x + gear.w && y >= gear.y && y < gear.y + gear.h;
}

export function getTitleButtonRects(w: number, h: number): readonly TitleButtonRect[] {
  const y = h - 30;
  const totalW = BUTTON_W * 2 + BUTTON_GAP;
  const leftX = (w - totalW) / 2;
  return [
    { id: "play", x: leftX, y, w: BUTTON_W, h: BUTTON_H },
    { id: "tutorial", x: leftX + BUTTON_W + BUTTON_GAP, y, w: BUTTON_W, h: BUTTON_H },
  ];
}

export function hitTestTitleButton(
  x: number,
  y: number,
  w: number,
  h: number,
): TitleButtonId | null {
  for (const btn of getTitleButtonRects(w, h)) {
    if (x >= btn.x && x < btn.x + btn.w && y >= btn.y && y < btn.y + btn.h) {
      return btn.id;
    }
  }
  return null;
}

export function drawTitleButtons(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  hovered: TitleButtonId | null,
): void {
  for (const btn of getTitleButtonRects(w, h)) {
    const active = btn.id === hovered;
    ctx.fillStyle = active ? COLORS.buttonOn : COLORS.buttonOff;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.fillStyle = active ? COLORS.buttonGlow : COLORS.buttonPlate;
    ctx.fillRect(btn.x + 2, btn.y + 2, btn.w - 4, btn.h - 4);
    ctx.font = active ? "bold 10px monospace" : "10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = COLORS.text;
    ctx.fillText(btn.id === "play" ? "PLAY" : "TUTORIAL", btn.x + btn.w / 2, btn.y + btn.h / 2);
  }
}

export function drawTitleSettingsGear(
  ctx: CanvasRenderingContext2D,
  w: number,
  hovered: boolean,
): void {
  const gear = getTitleSettingsGearRect(w);
  ctx.fillStyle = hovered ? COLORS.buttonOn : COLORS.buttonOff;
  ctx.fillRect(gear.x, gear.y, gear.w, gear.h);
  ctx.fillStyle = hovered ? COLORS.buttonGlow : COLORS.buttonPlate;
  ctx.fillRect(gear.x + 2, gear.y + 2, gear.w - 4, gear.h - 4);

  const cx = gear.x + gear.w / 2;
  const cy = gear.y + gear.h / 2;
  const c = COLORS.text;
  ctx.fillStyle = c;
  ctx.fillRect(cx - 1, cy - 6, 2, 3);
  ctx.fillRect(cx - 1, cy + 3, 2, 3);
  ctx.fillRect(cx - 6, cy - 1, 3, 2);
  ctx.fillRect(cx + 3, cy - 1, 3, 2);
  ctx.fillRect(cx - 4, cy - 4, 2, 2);
  ctx.fillRect(cx + 2, cy - 4, 2, 2);
  ctx.fillRect(cx - 4, cy + 2, 2, 2);
  ctx.fillRect(cx + 2, cy + 2, 2, 2);
  ctx.fillStyle = COLORS.bezelDark;
  ctx.fillRect(cx - 2, cy - 2, 4, 4);
}
