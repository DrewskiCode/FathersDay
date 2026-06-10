import { VIEW_H, VIEW_W, WALL_THICK } from "../constants";
import type { Rect } from "./types";

export const DOOR_TOP = 96;
export const DOOR_H = 48;

export type DoorConfig = {
  west?: boolean;
  east?: boolean;
};

/** Outer room boundary with optional door gaps on west/east walls. */
export function perimeterWalls(doors: DoorConfig): Rect[] {
  const T = WALL_THICK;
  const walls: Rect[] = [
    { x: 0, y: 0, w: VIEW_W, h: T },
    { x: 0, y: VIEW_H - T, w: VIEW_W, h: T },
  ];

  if (doors.west) {
    walls.push(
      { x: 0, y: T, w: T, h: DOOR_TOP - T },
      { x: 0, y: DOOR_TOP + DOOR_H, w: T, h: VIEW_H - T - (DOOR_TOP + DOOR_H) },
    );
  } else {
    walls.push({ x: 0, y: T, w: T, h: VIEW_H - 2 * T });
  }

  if (doors.east) {
    walls.push(
      { x: VIEW_W - T, y: T, w: T, h: DOOR_TOP - T },
      { x: VIEW_W - T, y: DOOR_TOP + DOOR_H, w: T, h: VIEW_H - T - (DOOR_TOP + DOOR_H) },
    );
  } else {
    walls.push({ x: VIEW_W - T, y: T, w: T, h: VIEW_H - 2 * T });
  }

  return walls;
}
