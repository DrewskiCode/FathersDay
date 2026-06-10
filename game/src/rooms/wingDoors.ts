import { VIEW_W, WALL_THICK } from "../constants";
import { DOOR_H, DOOR_TOP } from "./perimeter";
import type { Rect } from "./types";

/** Center hub wing gates — styled like security doors. */
export const LEFT_WING_DOOR: Rect = { x: 0, y: DOOR_TOP, w: WALL_THICK, h: DOOR_H };
export const RIGHT_WING_DOOR: Rect = {
  x: VIEW_W - WALL_THICK,
  y: DOOR_TOP,
  w: WALL_THICK,
  h: DOOR_H,
};

export type WingDoorSide = "left" | "right";

export function getWingDoorRect(side: WingDoorSide): Rect {
  return side === "left" ? LEFT_WING_DOOR : RIGHT_WING_DOOR;
}
