import type { RoomId } from "../rooms/world";

/** Rooms active for fire spawn / progression each round band. */
export function getUnlockedRooms(round: number): readonly RoomId[] {
  if (round <= 3) return ["center"];
  if (round <= 6) return ["center", "left"];
  return ["center", "left", "right"];
}

export function isRoomUnlocked(round: number, room: RoomId): boolean {
  return getUnlockedRooms(round).includes(room);
}

export function isWingDoorOpen(round: number, wing: "left" | "right"): boolean {
  if (wing === "left") return round >= 4;
  return round >= 7;
}

/** Seconds between random ignite attempts. R4/R7 dip for exploration. */
export function igniteIntervalSec(round: number): number {
  const table: Record<number, number> = {
    1: 14,
    2: 10,
    3: 8,
    4: 20,
    5: 11,
    6: 9,
    7: 18,
    8: 12,
    9: 10,
    10: 8,
  };
  if (round in table) return table[round];
  return Math.max(5, 8 - (round - 10) * 0.2);
}

/** Fire stage timers run faster as rounds climb (eased on explore rounds). */
export function fireStageSpeed(round: number): number {
  if (round === 4 || round === 7) return 0.85;
  return 1 + (round - 1) * 0.08;
}

/** Fires spawned immediately when a round begins. */
export function roundStartFireCount(round: number): number {
  if (round === 1) return 1;
  if (round === 2) return 2;
  if (round === 3) return 3;
  if (round === 4 || round === 7) return 0;
  if (round <= 6) return 2;
  return 1;
}

export function maxSimultaneousFires(round: number): number {
  if (round === 1) return 1;
  if (round === 2) return 2;
  if (round === 3) return 3;
  if (round === 4) return 2;
  if (round <= 6) return 4;
  return 3;
}

/** From round 7 onward, cap active fires per room. */
export function maxFiresPerRoom(round: number): number | null {
  if (round >= 7) return 1;
  return null;
}

export function wingUnlockMessage(round: number): string | null {
  if (round === 4) return "LEFT WING UNLOCKED";
  if (round === 7) return "RIGHT WING UNLOCKED";
  return null;
}

export function wingExploreSide(round: number): "left" | "right" | null {
  if (round === 4) return "left";
  if (round === 7) return "right";
  return null;
}

export function wingExplorePrompt(side: "left" | "right"): string {
  return side === "left" ? "Explore the left wing" : "Explore the right wing";
}
