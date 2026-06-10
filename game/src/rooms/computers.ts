import { DESK_H, DESK_W } from "../entities/computer";
import type { Rect } from "./types";
import type { RoomId } from "./world";

export type ComputerSlot = {
  x: number;
  y: number;
  /** For future collision — gate buttonId that must be open to reach this desk. */
  gateButtonId?: string;
};

/** Five desks per room — always visible; doors block access only. */
const SLOTS: Record<RoomId, readonly ComputerSlot[]> = {
  // Three north, two south — even spacing in each corridor bay
  center: [
    { x: 48, y: 92 },
    { x: 152, y: 92 },
    { x: 256, y: 92 },
    { x: 48, y: 210 },
    { x: 256, y: 210 },
  ],
  left: [
    { x: 118, y: 74 },
    { x: 118, y: 160 },
    { x: 204, y: 76 },
    { x: 218, y: 160 },
    { x: 40, y: 46, gateButtonId: "left-vault-button" },
  ],
  right: [
    { x: 54, y: 74 },
    { x: 54, y: 144 },
    { x: 160, y: 74 },
    { x: 268, y: 72, gateButtonId: "right-server-button" },
    // Inside sub bay — east of SUB gate (x=252), centered in the pocket
    { x: 160, y: 156, gateButtonId: "right-rack-button" },
  ],
  tutorial: [
    { x: 48, y: 108 },
    { x: 152, y: 108 },
    { x: 256, y: 108 },
  ],
};

export function getComputerSlots(room: RoomId): readonly ComputerSlot[] {
  return SLOTS[room];
}

/** Solid desk bodies — always block the player. */
export function getComputerCollisionRects(room: RoomId): readonly Rect[] {
  return getComputerSlots(room).map((slot) => ({
    x: slot.x,
    y: slot.y,
    w: DESK_W,
    h: DESK_H,
  }));
}
