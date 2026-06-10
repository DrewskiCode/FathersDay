import { PLAYER_H, PLAYER_W, VIEW_H, VIEW_W, WALL_THICK } from "../constants";
import type { Player } from "../entities/player";
import { getComputerCollisionRects } from "./computers";
import { CENTER_WALLS } from "./center";
import { LEFT_WALLS } from "./left";
import { TUTORIAL_WALLS } from "./tutorial";
import { DOOR_H, DOOR_TOP } from "./perimeter";
import { RIGHT_WALLS } from "./right";
import { isWingDoorOpen } from "../systems/rounds";
import type { RoomState } from "./state";
import type { Rect } from "./types";
import { collidesWithWalls } from "./types";
import { LEFT_WING_DOOR, RIGHT_WING_DOOR } from "./wingDoors";

export type RoomId = "left" | "center" | "right" | "tutorial";

const DOOR_SPAWN_Y = DOOR_TOP + (DOOR_H - PLAYER_H) / 2;

const STATIC_WALLS: Record<RoomId, readonly Rect[]> = {
  left: LEFT_WALLS,
  center: CENTER_WALLS,
  right: RIGHT_WALLS,
  tutorial: TUTORIAL_WALLS,
};

export function getRoomWalls(room: RoomId, state: RoomState): readonly Rect[] {
  return [...STATIC_WALLS[room], ...state.getClosedSecurityDoors(room)];
}

export function getDoorBlockers(room: RoomId, round: number): readonly Rect[] {
  if (room !== "center") return [];

  const blockers: Rect[] = [];
  if (!isWingDoorOpen(round, "left")) {
    blockers.push(LEFT_WING_DOOR);
  }
  if (!isWingDoorOpen(round, "right")) {
    blockers.push(RIGHT_WING_DOOR);
  }
  return blockers;
}

export type WingDoorDraw = {
  side: "left" | "right";
  rect: Rect;
  open: boolean;
};

export function getWingDoorsToDraw(room: RoomId, round: number): readonly WingDoorDraw[] {
  if (room !== "center") return [];

  return [
    { side: "left", rect: LEFT_WING_DOOR, open: isWingDoorOpen(round, "left") },
    { side: "right", rect: RIGHT_WING_DOOR, open: isWingDoorOpen(round, "right") },
  ];
}

/** All collision solids — walls, doors, and desks. */
export function getSolidObstacles(
  room: RoomId,
  state: RoomState,
  round: number,
): readonly Rect[] {
  return [
    ...getComputerCollisionRects(room),
    ...getRoomWalls(room, state),
    ...getDoorBlockers(room, round),
  ];
}

/** Movement blockers — empty during ghost walk (pass through walls and desks). */
export function getPlayerObstacles(
  room: RoomId,
  state: RoomState,
  round: number,
  ghostWalk: boolean,
): readonly Rect[] {
  if (ghostWalk) return [];
  return getSolidObstacles(room, state, round);
}

function isValidPlayerPosition(box: Rect, solids: readonly Rect[]): boolean {
  if (box.x < WALL_THICK || box.y < WALL_THICK) return false;
  if (box.x + box.w > VIEW_W - WALL_THICK) return false;
  if (box.y + box.h > VIEW_H - WALL_THICK) return false;
  return !collidesWithWalls(box, solids);
}

/** If the player overlaps solids, move them to the nearest open tile. */
export function resolvePlayerFromSolids(player: Player, solids: readonly Rect[]): void {
  if (isValidPlayerPosition(player.hitbox(), solids)) return;

  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;

  for (let radius = 0; radius <= 140; radius += 2) {
    for (let deg = 0; deg < 360; deg += 10) {
      const rad = (deg * Math.PI) / 180;
      const x = cx + Math.cos(rad) * radius - player.w / 2;
      const y = cy + Math.sin(rad) * radius - player.h / 2;
      const candidate = { x, y, w: player.w, h: player.h };
      if (isValidPlayerPosition(candidate, solids)) {
        player.x = x;
        player.y = y;
        return;
      }
    }
  }
}

function inDoorBand(player: Player): boolean {
  const midY = player.y + player.h / 2;
  return midY >= DOOR_TOP + 4 && midY <= DOOR_TOP + DOOR_H - 4;
}

/** Adventure-style hard cut when the player walks through a door gap. */
export function tryRoomTransition(
  room: RoomId,
  player: Player,
  round: number,
): RoomId | null {
  if (!inDoorBand(player)) return null;

  if (room === "center") {
    if (player.x <= 1 && isWingDoorOpen(round, "left")) return "left";
    if (player.x + player.w >= VIEW_W - 1 && isWingDoorOpen(round, "right")) return "right";
    return null;
  }

  if (room === "tutorial") return null;

  if (room === "left" && player.x + player.w >= VIEW_W - 1) return "center";
  if (room === "right" && player.x <= 1) return "center";
  return null;
}

function placeAtDoor(player: Player, side: "west" | "east"): void {
  player.x = side === "west" ? WALL_THICK + 4 : VIEW_W - WALL_THICK - PLAYER_W - 4;
  player.y = DOOR_SPAWN_Y;
}

/** Snap player to the inner doorway after a room change. */
export function applyRoomTransition(from: RoomId, to: RoomId, player: Player): void {
  if (to === "center" && from === "left") placeAtDoor(player, "west");
  else if (to === "center" && from === "right") placeAtDoor(player, "east");
  else if (to === "left" && from === "center") placeAtDoor(player, "east");
  else if (to === "right" && from === "center") placeAtDoor(player, "west");
}
