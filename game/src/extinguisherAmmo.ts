import {
  EXTINGUISHER_MAX_USES,
  EXTINGUISHER_RELOAD_SEC,
  EXTINGUISHER_STATION_RANGE,
} from "./constants";
import { ExtinguisherSpray } from "./entities/spray";
import type { Player } from "./entities/player";
import type { Input } from "./input";
import { getWallExtinguishers } from "./rooms/decorations";
import type { RoomId } from "./rooms/world";

const STATION_ANCHOR_X = 4;
const STATION_ANCHOR_Y = 8;

export function isNearWallExtinguisher(player: Player, room: RoomId): boolean {
  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;
  const rangeSq = EXTINGUISHER_STATION_RANGE * EXTINGUISHER_STATION_RANGE;

  for (const station of getWallExtinguishers(room)) {
    const dx = px - (station.x + STATION_ANCHOR_X);
    const dy = py - (station.y + STATION_ANCHOR_Y);
    if (dx * dx + dy * dy <= rangeSq) {
      return true;
    }
  }
  return false;
}

export class ExtinguisherAmmo {
  uses = EXTINGUISHER_MAX_USES;
  readonly maxUses = EXTINGUISHER_MAX_USES;
  readonly spray = new ExtinguisherSpray();
  isReloading = false;
  reloadElapsed = 0;
  unlimitedSpray = false;

  reset(): void {
    this.uses = this.maxUses;
    this.isReloading = false;
    this.reloadElapsed = 0;
    this.unlimitedSpray = false;
    this.spray.reset();
  }

  setUnlimitedSpray(on: boolean): void {
    this.unlimitedSpray = on;
  }

  get reloadProgress(): number {
    return Math.min(1, this.reloadElapsed / EXTINGUISHER_RELOAD_SEC);
  }

  get isBusy(): boolean {
    return this.isReloading || this.spray.isSpraying;
  }

  tryStartSpray(input: Input): boolean {
    if (this.isBusy) return false;
    if (!this.unlimitedSpray && this.uses <= 0) return false;
    if (!input.wasPressed("Space")) return false;
    if (!this.unlimitedSpray) {
      this.uses -= 1;
    }
    this.spray.start();
    return true;
  }

  update(input: Input, dt: number, nearStation: boolean): boolean {
    this.spray.update(dt);
    let reloaded = false;

    if (this.isReloading) {
      this.reloadElapsed += dt;
      if (this.reloadElapsed >= EXTINGUISHER_RELOAD_SEC) {
        this.uses = this.maxUses;
        this.isReloading = false;
        this.reloadElapsed = 0;
        reloaded = true;
      }
      return reloaded;
    }

    if (this.spray.isSpraying) return false;

    if (nearStation && !this.unlimitedSpray && input.wasPressed("KeyR")) {
      this.isReloading = true;
      this.reloadElapsed = 0;
    }
    return false;
  }
}
