import type { ComputerStateManager } from "../entities/computerState";
import { isWingDoorOpen } from "./rounds";
import type { RoomId } from "../rooms/world";

export type DoorSide = "west" | "east";

export type DoorFireAlert = {
  side: DoorSide;
  /** Adjacent room that has active fires. */
  adjacentRoom: RoomId;
  fireCount: number;
};

/** Which doors should show a fire alert for the current room. */
export function getDoorFireAlerts(
  room: RoomId,
  round: number,
  computers: ComputerStateManager,
): DoorFireAlert[] {
  const alerts: DoorFireAlert[] = [];

  if (room === "center") {
    if (isWingDoorOpen(round, "left")) {
      const count = computers.countActiveFiresInRoom("left");
      if (count > 0) alerts.push({ side: "west", adjacentRoom: "left", fireCount: count });
    }
    if (isWingDoorOpen(round, "right")) {
      const count = computers.countActiveFiresInRoom("right");
      if (count > 0) alerts.push({ side: "east", adjacentRoom: "right", fireCount: count });
    }
  } else if (room === "left") {
    const count = computers.countActiveFiresInRoom("center");
    if (count > 0) alerts.push({ side: "east", adjacentRoom: "center", fireCount: count });
  } else if (room === "right") {
    const count = computers.countActiveFiresInRoom("center");
    if (count > 0) alerts.push({ side: "west", adjacentRoom: "center", fireCount: count });
  }

  return alerts;
}
