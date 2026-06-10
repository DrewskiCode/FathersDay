import type { Rect } from "./types";
import type { RoomId } from "./world";

const SEG = 10;

export const RIGHT_SERVER_ZONE: Rect = { x: 254, y: 66, w: 58, h: 58 };

export type FloorButtonDef = {
  id: string;
  rect: Rect;
  requiresButton?: string;
  requiresZone?: Rect;
};

export type SecurityDoorDef = {
  id: string;
  buttonId: string;
  closedRect: Rect;
  variant?: "server";
};

export type FloorAccent = Rect & { variant?: "server" | "vault" };

export type RoomInteractives = {
  buttons: readonly FloorButtonDef[];
  securityDoors: readonly SecurityDoorDef[];
  floorAccents: readonly FloorAccent[];
};

export const LEFT_INTERACTIVES: RoomInteractives = {
  buttons: [
    {
      id: "left-vault-button",
      rect: { x: 248, y: 198, w: 18, h: 14 },
    },
  ],
  securityDoors: [
    {
      id: "left-vault-door",
      buttonId: "left-vault-button",
      closedRect: { x: 54, y: 40, w: SEG, h: 28 },
    },
  ],
  floorAccents: [],
};

export const RIGHT_INTERACTIVES: RoomInteractives = {
  buttons: [
    {
      id: "right-server-button",
      rect: { x: 40, y: 156, w: 18, h: 14 },
    },
    {
      id: "right-rack-button",
      rect: { x: 276, y: 100, w: 18, h: 14 },
      requiresButton: "right-server-button",
      requiresZone: RIGHT_SERVER_ZONE,
    },
  ],
  securityDoors: [
    {
      id: "right-server-gate",
      buttonId: "right-server-button",
      closedRect: { x: 252, y: 88, w: SEG, h: 20 },
      variant: "server",
    },
    {
      id: "right-sub-gate",
      buttonId: "right-rack-button",
      closedRect: { x: 252, y: 148, w: SEG, h: 20 },
    },
  ],
  floorAccents: [],
};

const BY_ROOM: Partial<Record<RoomId, RoomInteractives>> = {
  left: LEFT_INTERACTIVES,
  right: RIGHT_INTERACTIVES,
};

export function getRoomInteractives(room: RoomId): RoomInteractives {
  return BY_ROOM[room] ?? { buttons: [], securityDoors: [], floorAccents: [] };
}
