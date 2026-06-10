import { COLORS } from "../colors";
import { DOOR_H, DOOR_TOP } from "../rooms/perimeter";
import { fireLayerColor } from "../fire";
import type { DoorFireAlert, DoorSide } from "../systems/doorAlerts";

/** Small HUD box beside a door — arrow points toward the doorway. */
export function drawDoorFireIndicator(
  ctx: CanvasRenderingContext2D,
  alert: DoorFireAlert,
  animTime: number,
): void {
  const doorMidY = DOOR_TOP + DOOR_H / 2;
  const boxW = 18;
  const boxH = 16;
  const pulse = Math.floor(animTime * 4) % 2 === 0;

  let boxX = 0;
  if (alert.side === "west") {
    boxX = 12;
  } else {
    boxX = ctx.canvas.width - 12 - boxW;
  }
  const boxY = doorMidY - boxH / 2;

  ctx.fillStyle = COLORS.bezelDark;
  ctx.fillRect(boxX - 1, boxY - 1, boxW + 2, boxH + 2);
  ctx.fillStyle = pulse ? "#4a3830" : COLORS.bezel;
  ctx.fillRect(boxX, boxY, boxW, boxH);

  drawMiniFire(ctx, boxX + boxW / 2, boxY + boxH - 3, animTime);

  if (alert.fireCount > 1) {
    ctx.fillStyle = COLORS.fireRed;
    ctx.fillRect(boxX + boxW - 7, boxY - 3, 6, 6);
    ctx.font = "6px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = COLORS.text;
    ctx.fillText(String(alert.fireCount), boxX + boxW - 4, boxY);
  }

  drawDoorArrow(ctx, alert.side, boxX, boxY, boxW, boxH, pulse);
}

function drawMiniFire(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  t: number,
): void {
  const flicker = Math.floor(t * 10) % 2;
  ctx.fillStyle = fireLayerColor("yellow");
  ctx.fillRect(cx - 1, baseY - 3, 3, 2);
  ctx.fillStyle = flicker ? fireLayerColor("orange") : fireLayerColor("yellow");
  ctx.fillRect(cx - 2, baseY - 5, 2, 2);
  ctx.fillRect(cx + 1, baseY - 5, 2, 2);
  if (flicker) {
    ctx.fillStyle = fireLayerColor("red");
    ctx.fillRect(cx, baseY - 6, 1, 1);
  }
}

function drawDoorArrow(
  ctx: CanvasRenderingContext2D,
  side: DoorSide,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  pulse: boolean,
): void {
  ctx.fillStyle = pulse ? COLORS.fireYellow : COLORS.text;
  const cy = boxY + boxH / 2;

  if (side === "west") {
    const tipX = boxX - 2;
    ctx.fillRect(tipX - 5, cy - 1, 5, 3);
    ctx.fillRect(tipX - 3, cy - 3, 3, 3);
    ctx.fillRect(tipX - 3, cy + 1, 3, 3);
  } else {
    const tipX = boxX + boxW + 2;
    ctx.fillRect(tipX, cy - 1, 5, 3);
    ctx.fillRect(tipX + 2, cy - 3, 3, 3);
    ctx.fillRect(tipX + 2, cy + 1, 3, 3);
  }
}

/** Blinking explore arrow at a wing door. */
export function drawExploreArrow(
  ctx: CanvasRenderingContext2D,
  side: "left" | "right",
  animTime: number,
  viewW: number,
): void {
  const blink = Math.floor(animTime * 3) % 2 === 0;
  if (!blink) return;

  const doorY = DOOR_TOP + DOOR_H / 2;
  const x = side === "left" ? 22 : viewW - 22;

  ctx.fillStyle = COLORS.fireYellow;
  if (side === "left") {
    ctx.fillRect(x - 10, doorY - 4, 8, 8);
    ctx.fillRect(x - 14, doorY, 4, 4);
    ctx.fillRect(x - 6, doorY - 8, 4, 4);
    ctx.fillRect(x - 6, doorY + 4, 4, 4);
  } else {
    ctx.fillRect(x + 2, doorY - 4, 8, 8);
    ctx.fillRect(x + 10, doorY, 4, 4);
    ctx.fillRect(x + 2, doorY - 8, 4, 4);
    ctx.fillRect(x + 2, doorY + 4, 4, 4);
  }
}
