import { COLORS } from "../colors";
import { drawExtinguisher } from "./extinguisher";

export type Decoration =
  | { kind: "rug"; x: number; y: number; w: number; h: number }
  | { kind: "sofa"; x: number; y: number }
  | { kind: "beanbag"; x: number; y: number }
  | { kind: "table"; x: number; y: number }
  | { kind: "kitchen"; x: number; y: number }
  | { kind: "extinguisher"; x: number; y: number };

function drawRug(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = COLORS.rug;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = COLORS.rugBorder;
  ctx.fillRect(x, y, w, 2);
  ctx.fillRect(x, y + h - 2, w, 2);
  ctx.fillRect(x, y, 2, h);
  ctx.fillRect(x + w - 2, y, 2, h);
  ctx.fillStyle = COLORS.rugAccent;
  ctx.fillRect(x + 4, y + 3, w - 8, 2);
}

function drawSofa(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = COLORS.sofa;
  ctx.fillRect(x, y + 4, 20, 6);
  ctx.fillRect(x, y, 4, 8);
  ctx.fillRect(x + 16, y, 4, 8);
  ctx.fillStyle = COLORS.sofaLight;
  ctx.fillRect(x + 4, y + 5, 12, 2);
}

function drawBeanbag(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = COLORS.beanbag;
  ctx.fillRect(x + 2, y + 2, 12, 10);
  ctx.fillRect(x + 4, y, 8, 4);
  ctx.fillStyle = COLORS.beanbagLight;
  ctx.fillRect(x + 5, y + 4, 4, 3);
}

function drawTable(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = COLORS.desk;
  ctx.fillRect(x, y, 16, 4);
  ctx.fillStyle = COLORS.deskDark;
  ctx.fillRect(x + 2, y + 4, 2, 5);
  ctx.fillRect(x + 12, y + 4, 2, 5);
}

function drawKitchen(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = COLORS.kitchenCounter;
  ctx.fillRect(x, y, 28, 8);
  ctx.fillStyle = COLORS.kitchenTile;
  ctx.fillRect(x + 2, y - 6, 24, 6);
  ctx.fillStyle = COLORS.sink;
  ctx.fillRect(x + 10, y + 1, 8, 4);
  ctx.fillStyle = COLORS.foam;
  ctx.fillRect(x + 12, y + 2, 4, 2);
  ctx.fillStyle = COLORS.microwave;
  ctx.fillRect(x + 20, y - 4, 6, 5);
  ctx.fillStyle = COLORS.screen;
  ctx.fillRect(x + 21, y - 3, 4, 3);
}

export function drawDecoration(ctx: CanvasRenderingContext2D, deco: Decoration): void {
  switch (deco.kind) {
    case "rug":
      drawRug(ctx, deco.x, deco.y, deco.w, deco.h);
      break;
    case "sofa":
      drawSofa(ctx, deco.x, deco.y);
      break;
    case "beanbag":
      drawBeanbag(ctx, deco.x, deco.y);
      break;
    case "table":
      drawTable(ctx, deco.x, deco.y);
      break;
    case "kitchen":
      drawKitchen(ctx, deco.x, deco.y);
      break;
    case "extinguisher":
      drawExtinguisher(ctx, deco.x, deco.y);
      break;
  }
}
