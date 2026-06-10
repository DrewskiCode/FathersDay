import type { Rect } from "./types";
import { perimeterWalls } from "./perimeter";

/** Small training room — three demo desks, wall extinguisher, no exits. */
export const TUTORIAL_Y_OFFSET = 36;

/** Right-side reload alcove (east of divider). */
export const TUTORIAL_STATION_ALCOVE: Rect = {
  x: 276,
  y: 132,
  w: 36,
  h: 92,
};

export const TUTORIAL_WALLS: readonly Rect[] = [
  ...perimeterWalls({}),
  { x: 120, y: 128 + TUTORIAL_Y_OFFSET, w: 80, h: 8 },
  // Divider — opening below y=210 lets the player walk into the right alcove
  { x: 268, y: 132, w: 8, h: 78 },
];

/** Clear of bottom wall (y + PLAYER_H <= 232). */
export const TUTORIAL_SPAWN = { x: 154, y: 206 };
