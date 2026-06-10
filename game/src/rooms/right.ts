import type { Rect } from "./types";
import { INSET, SEG } from "./layout";
import { perimeterWalls } from "./perimeter";

const W = SEG;

/**
 * Right office — server bay (NE) + sub bay below it.
 * SRV gate upper west wall; SUB gate lower west wall at x=252.
 */
export const RIGHT_WALLS: readonly Rect[] = [
  ...perimeterWalls({ west: true }),

  { x: INSET, y: 56, w: 272, h: W },
  { x: INSET, y: 174, w: 272, h: W },

  { x: 132, y: 66, w: W, h: 108 },
  { x: 132, y: 124, w: 120, h: W },

  // Server bay (NE) — SRV gate at y=88..108
  { x: 252, y: 66, w: W, h: 22 },
  { x: 252, y: 108, w: W, h: 16 },
  { x: 252, y: 124, w: 60, h: W },

  // Sub bay west wall — SUB gate at y=148..168
  { x: 252, y: 134, w: W, h: 14 },
  { x: 252, y: 168, w: W, h: 6 },
];
