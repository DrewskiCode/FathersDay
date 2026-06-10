import type { Rect } from "./types";
import { INSET, SEG } from "./layout";
import { perimeterWalls } from "./perimeter";

const W = SEG;

/**
 * Left office — NW security vault + one T-shaped divider.
 * Every segment shares an edge with its neighbor (no gaps/overlaps).
 * All five zones reachable once the vault door is open.
 */
export const LEFT_WALLS: readonly Rect[] = [
  ...perimeterWalls({ east: true }),

  // Vault box (door gap y=40..68 on east face x=54..66)
  { x: INSET, y: 28, w: 30, h: W },
  { x: INSET, y: 28, w: W, h: 46 },
  { x: INSET, y: 74, w: 30, h: W },
  { x: 54, y: 28, w: W, h: 12 },
  { x: 54, y: 68, w: W, h: 12 },

  // Top bar east of vault lane (x=66..88 open)
  { x: 88, y: 56, w: 208, h: W },

  // Bottom bar
  { x: INSET, y: 174, w: 282, h: W },

  // T-divider: vertical meets top bar (y=66) and bottom bar (y=174)
  { x: 188, y: 66, w: W, h: 108 },
  // Shelf — west from vertical through to the back (west) wall at INSET
  { x: INSET, y: 124, w: 188 - INSET, h: W },
];
