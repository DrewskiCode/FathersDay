import { COLORS } from "../colors";
import { VIEW_H, VIEW_W } from "../constants";
import { drawComputerDesk } from "../entities/computer";
import { computerId, type ComputerStateManager } from "../entities/computerState";
import { drawDecoration } from "../entities/decorations";
import { getDoorFireAlerts } from "../systems/doorAlerts";
import { wingExploreSide } from "../systems/rounds";
import {
  drawCoffeeCup,
  drawCoffeeTable,
  drawCoin,
} from "../entities/collectibles";
import type { OfficeWorkerManager } from "../entities/officeWorkers";
import type { CollectiblesManager } from "../systems/collectibles";
import { drawDoorFireIndicator, drawExploreArrow } from "../ui/doorFireIndicator";
import { getComputerSlots } from "./computers";
import { getRoomDecorations } from "./decorations";
import type { RoomInteractives, SecurityDoorDef } from "./interactives";
import type { Player } from "../entities/player";
import type { RoomState } from "./state";
import type { Rect } from "./types";
import { rectsOverlap } from "./types";
import { getWingDoorsToDraw, type RoomId } from "./world";

function drawWall(ctx: CanvasRenderingContext2D, wall: Rect): void {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

  ctx.fillStyle = COLORS.wallLight;
  ctx.fillRect(wall.x, wall.y, wall.w, 2);
  ctx.fillRect(wall.x, wall.y, 2, wall.h);

  ctx.fillStyle = COLORS.wallDark;
  ctx.fillRect(wall.x, wall.y + wall.h - 2, wall.w, 2);
  ctx.fillRect(wall.x + wall.w - 2, wall.y, 2, wall.h);
}

function drawSecurityDoor(
  ctx: CanvasRenderingContext2D,
  door: SecurityDoorDef,
  open: boolean,
): void {
  const { closedRect: r } = door;
  if (open) {
    ctx.fillStyle = COLORS.doorFrame;
    ctx.fillRect(r.x - 1, r.y - 2, r.w + 2, r.h + 4);
    ctx.fillStyle = COLORS.doorOpen;
    ctx.fillRect(r.x + 1, r.y, r.w - 2, 2);
    ctx.fillRect(r.x + 1, r.y + r.h - 2, r.w - 2, 2);
    return;
  }

  ctx.fillStyle = door.variant === "server" ? COLORS.serverAccent : COLORS.securityDoor;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = COLORS.securityStripe;
  ctx.fillRect(r.x + 2, r.y + 3, r.w - 4, 3);
  ctx.fillRect(r.x + 2, r.y + r.h - 6, r.w - 4, 3);
  ctx.fillStyle = COLORS.wallDark;
  ctx.fillRect(r.x, r.y + r.h - 2, r.w, 2);
}

function canUseButton(
  button: RoomInteractives["buttons"][number],
  state: RoomState,
  player: Player,
): boolean {
  if (button.requiresButton && !state.isButtonPressed(button.requiresButton)) {
    return false;
  }
  if (button.requiresZone && !rectsOverlap(player.hitbox(), button.requiresZone)) {
    return false;
  }
  return true;
}

function drawWingDoor(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  open: boolean,
): void {
  if (open) {
    ctx.fillStyle = COLORS.doorFrame;
    ctx.fillRect(rect.x - 1, rect.y - 2, rect.w + 2, rect.h + 4);
    ctx.fillStyle = COLORS.doorOpen;
    ctx.fillRect(rect.x + 1, rect.y, rect.w - 2, 2);
    ctx.fillRect(rect.x + 1, rect.y + rect.h - 2, rect.w - 2, 2);
    return;
  }

  ctx.fillStyle = COLORS.wingLock;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = COLORS.securityStripe;
  ctx.fillRect(rect.x + 1, rect.y + 8, rect.w - 2, 3);
  ctx.fillRect(rect.x + 1, rect.y + rect.h - 11, rect.w - 2, 3);
  // Padlock
  ctx.fillStyle = COLORS.fireYellow;
  ctx.fillRect(rect.x + 2, rect.y + rect.h / 2 - 2, rect.w - 4, 5);
  ctx.fillStyle = COLORS.wingLock;
  ctx.fillRect(rect.x + 3, rect.y + rect.h / 2 - 5, rect.w - 6, 4);
  ctx.fillStyle = COLORS.wallDark;
  ctx.fillRect(rect.x, rect.y + rect.h - 2, rect.w, 2);
}

export function drawRoom(
  ctx: CanvasRenderingContext2D,
  room: RoomId,
  walls: readonly Rect[],
  interactives: RoomInteractives,
  state: RoomState,
  player: Player,
  computers: ComputerStateManager,
  round: number,
  animTime: number,
  showExplorePrompt: boolean,
  collectibles: CollectiblesManager | null = null,
  officeWorkers: OfficeWorkerManager | null = null,
): void {
  ctx.fillStyle = COLORS.salmon;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  for (const deco of getRoomDecorations(room)) {
    if (deco.kind === "rug") {
      drawDecoration(ctx, deco);
    }
  }

  for (const accent of interactives.floorAccents) {
    ctx.fillStyle =
      accent.variant === "server" ? COLORS.serverAccent : COLORS.floorAccent;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(accent.x, accent.y, accent.w, accent.h);
    ctx.globalAlpha = 1;
  }

  for (const wall of walls) {
    drawWall(ctx, wall);
  }

  for (const door of interactives.securityDoors) {
    drawSecurityDoor(ctx, door, state.isButtonPressed(door.buttonId));
  }

  for (const wing of getWingDoorsToDraw(room, round)) {
    drawWingDoor(ctx, wing.rect, wing.open);
  }

  for (const deco of getRoomDecorations(room)) {
    if (deco.kind !== "rug") {
      drawDecoration(ctx, deco);
    }
  }

  getComputerSlots(room).forEach((slot, index) => {
    const id = computerId(room, index);
    drawComputerDesk(
      ctx,
      slot.x,
      slot.y,
      computers.getState(id),
      computers.animTime,
    );
    const flame = computers.getDeskFlame(id);
    const fireOpts = computers.getFireDrawOptions(id);
    if (flame && fireOpts) {
      flame.draw(ctx, slot.x + 8, slot.y + 1, fireOpts);
    }
  });

  if (room === "center" && showExplorePrompt) {
    const side = wingExploreSide(round);
    if (side) {
      drawExploreArrow(ctx, side, animTime, VIEW_W);
    }
  }

  for (const alert of getDoorFireAlerts(room, round, computers)) {
    drawDoorFireIndicator(ctx, alert, animTime);
  }

  for (const button of interactives.buttons) {
    if (!canUseButton(button, state, player)) continue;
    const pressed = state.isButtonPressed(button.id);
    const { x, y, w, h } = button.rect;
    ctx.fillStyle = pressed ? COLORS.buttonOn : COLORS.buttonOff;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = pressed ? COLORS.buttonGlow : COLORS.buttonPlate;
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  }

  if (officeWorkers) {
    officeWorkers.draw(ctx, room, computers);
  }

  if (collectibles) {
    for (const table of collectibles.tablesInRoom(room)) {
      drawCoffeeTable(ctx, table.x, table.y);
      if (collectibles.cupOnTable(table.id)) {
        drawCoffeeCup(ctx, table);
      }
    }
    for (const coin of collectibles.coinsInRoom(room)) {
      drawCoin(ctx, coin.x, coin.y, animTime);
    }
  }
}
