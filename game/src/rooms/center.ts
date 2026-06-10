import type { Rect } from "./types";
import { perimeterWalls } from "./perimeter";

/** Center office — hub with west and east doors (original layout). */
export const CENTER_WALLS: readonly Rect[] = [
  ...perimeterWalls({ west: true, east: true }),
  { x: 24, y: 56, w: 272, h: 10 },
  { x: 24, y: 174, w: 272, h: 10 },
  { x: 72, y: 86, w: 12, h: 62 },
  { x: 236, y: 86, w: 12, h: 62 },
  { x: 140, y: 108, w: 40, h: 14 },
];

export const CENTER_SPAWN = { x: 154, y: 132 };
