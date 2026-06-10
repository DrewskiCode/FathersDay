import type { Decoration } from "../entities/decorations";
import type { RoomId } from "./world";

/**
 * Visual-only props — no collision.
 * Cleared of desks (16×14), maze walls, and other decor (≥4px gap).
 */
const BY_ROOM: Record<RoomId, readonly Decoration[]> = {
  center: [
    { kind: "rug", x: 132, y: 148, w: 40, h: 16 },
    { kind: "rug", x: 28, y: 68, w: 14, h: 10 },
    { kind: "sofa", x: 88, y: 124 },
    { kind: "beanbag", x: 180, y: 124 },
    { kind: "table", x: 88, y: 30 },
    { kind: "table", x: 180, y: 30 },
    { kind: "kitchen", x: 104, y: 158 },
    // Center divider south face (y=108 wall)
    { kind: "extinguisher", x: 156, y: 110 },
  ],
  left: [
    { kind: "rug", x: 48, y: 88, w: 30, h: 16 },
    { kind: "rug", x: 138, y: 150, w: 28, h: 14 },
    { kind: "sofa", x: 240, y: 152 },
    { kind: "beanbag", x: 48, y: 150 },
    { kind: "table", x: 148, y: 92 },
    { kind: "kitchen", x: 248, y: 72 },
    // T-divider west face (x=188 wall)
    { kind: "extinguisher", x: 178, y: 92 },
  ],
  right: [
    { kind: "rug", x: 76, y: 96, w: 32, h: 18 },
    { kind: "rug", x: 80, y: 152, w: 32, h: 14 },
    { kind: "sofa", x: 28, y: 68 },
    { kind: "beanbag", x: 76, y: 120 },
    { kind: "table", x: 88, y: 74 },
    { kind: "kitchen", x: 200, y: 148 },
    // T-divider west face (x=132 wall)
    { kind: "extinguisher", x: 124, y: 92 },
  ],
  tutorial: [
    { kind: "rug", x: 132, y: 184, w: 56, h: 20 },
    // West face of east wall — right-side reload alcove
    { kind: "extinguisher", x: 292, y: 168 },
  ],
};

export function getRoomDecorations(room: RoomId): readonly Decoration[] {
  return BY_ROOM[room] ?? [];
}

export function getWallExtinguishers(
  room: RoomId,
): readonly { x: number; y: number }[] {
  return getRoomDecorations(room)
    .filter((d): d is Decoration & { kind: "extinguisher" } => d.kind === "extinguisher")
    .map((d) => ({ x: d.x, y: d.y }));
}
