import type { Player } from "../entities/player";
import { getRoomInteractives } from "./interactives";
import type { Rect } from "./types";
import { rectsOverlap } from "./types";
import type { RoomId } from "./world";

export class RoomState {
  private readonly pressedButtons = new Set<string>();

  reset(): void {
    this.pressedButtons.clear();
  }

  updateRoom(room: RoomId, player: Player): void {
    const { buttons } = getRoomInteractives(room);
    const feet = player.hitbox();

    for (const button of buttons) {
      if (button.requiresButton && !this.pressedButtons.has(button.requiresButton)) {
        continue;
      }
      if (button.requiresZone && !rectsOverlap(feet, button.requiresZone)) {
        continue;
      }
      if (!rectsOverlap(feet, button.rect)) {
        continue;
      }
      this.pressedButtons.add(button.id);
    }
  }

  isButtonPressed(buttonId: string): boolean {
    return this.pressedButtons.has(buttonId);
  }

  getClosedSecurityDoors(room: RoomId): Rect[] {
    const { securityDoors } = getRoomInteractives(room);
    return securityDoors
      .filter((door) => !this.isButtonPressed(door.buttonId))
      .map((door) => door.closedRect);
  }
}
