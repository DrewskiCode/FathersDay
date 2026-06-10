import { DESK_W } from "../entities/computer";
import type { ComputerId, ComputerStateManager } from "../entities/computerState";
import { isFireState } from "../entities/computerState";
import type { Facing, Player } from "../entities/player";
import { SPRAY_RANGE } from "../constants";
import type { RoomId } from "../rooms/world";

export function facingMatches(facing: Facing, dx: number, dy: number): boolean {
  switch (facing) {
    case "right":
      return dx > 4 && Math.abs(dy) <= Math.abs(dx) * 1.4;
    case "left":
      return dx < -4 && Math.abs(dy) <= Math.abs(dx) * 1.4;
    case "up":
      return dy < -4 && Math.abs(dx) <= Math.abs(dy) * 1.4;
    case "down":
      return dy > 4 && Math.abs(dx) <= Math.abs(dy) * 1.4;
  }
}

/** Closest burning desk in front of the player (current room only). */
export function findSprayTarget(
  player: Player,
  room: RoomId,
  computers: ComputerStateManager,
): ComputerId | null {
  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;
  const rangeSq = SPRAY_RANGE * SPRAY_RANGE;

  let best: { id: ComputerId; distSq: number } | null = null;

  for (const id of computers.listFireDesksInRoom(room)) {
    if (computers.isFrozen(id)) continue;
    if (!isFireState(computers.getState(id))) continue;
    const center = computers.getMonitorCenter(id);
    if (!center) continue;

    const dx = center.x - px;
    const dy = center.y - py;
    const distSq = dx * dx + dy * dy;
    if (distSq > rangeSq) continue;
    if (!facingMatches(player.facing, dx, dy)) continue;

    if (!best || distSq < best.distSq) {
      best = { id, distSq };
    }
  }

  return best?.id ?? null;
}

/** True if a point is within spray range and the player's facing cone. */
export function inExtinguisherSprayArc(
  player: Player,
  tx: number,
  ty: number,
  tw = 10,
  th = 14,
): boolean {
  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;
  const cx = tx + tw / 2;
  const cy = ty + th / 2;
  const dx = cx - px;
  const dy = cy - py;
  if (dx * dx + dy * dy > SPRAY_RANGE * SPRAY_RANGE) return false;
  return facingMatches(player.facing, dx, dy);
}

/** Desk hitbox used as a fallback proximity check. */
export function deskInSprayArc(
  player: Player,
  deskX: number,
  deskY: number,
): boolean {
  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;
  const cx = deskX + DESK_W / 2;
  const cy = deskY + 4;
  const dx = cx - px;
  const dy = cy - py;
  if (dx * dx + dy * dy > SPRAY_RANGE * SPRAY_RANGE) return false;
  return facingMatches(player.facing, dx, dy);
}
