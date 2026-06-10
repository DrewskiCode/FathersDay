import type { ExtinguisherAmmo } from "../extinguisherAmmo";
import type {
  ComputerId,
  ComputerStateManager,
} from "../entities/computerState";
import { computerId } from "../entities/computerState";
import type { Player } from "../entities/player";
import { SPRAY_RANGE } from "../constants";
import { getWallExtinguishers } from "../rooms/decorations";
import { TUTORIAL_STATION_ALCOVE } from "../rooms/tutorial";
import type { Rect } from "../rooms/types";

export const TUTORIAL_YELLOW = computerId("tutorial", 0);
export const TUTORIAL_ORANGE = computerId("tutorial", 1);
export const TUTORIAL_RED = computerId("tutorial", 2);
/** Interactive desk for spray / power-up steps (left / yellow slot). */
export const TUTORIAL_PRACTICE = TUTORIAL_YELLOW;

export type TutorialStepId =
  | "move"
  | "coins"
  | "extinguish"
  | "combo"
  | "stages"
  | "npc"
  | "refill"
  | "coffee"
  | "purple"
  | "green"
  | "white"
  | "rainbow"
  | "done";

export type TutorialStepSignals = {
  coinsCollected: number;
  comboStreak: number;
  npcKnocked: boolean;
  coffeeCollected: boolean;
};

export type TutorialPrompt = {
  main: string;
  hint?: string;
};

export type TutorialWalkthroughConfig = {
  allowMove: boolean;
  allowSpray: boolean;
  allowReload: boolean;
  highlightStation: boolean;
  highlightPracticeDesk: boolean;
  showStageLabels: boolean;
};

const STEPS: readonly TutorialStepId[] = [
  "move",
  "coins",
  "extinguish",
  "combo",
  "stages",
  "npc",
  "refill",
  "coffee",
  "purple",
  "green",
  "white",
  "rainbow",
  "done",
];

const TUTORIAL_COIN_GOAL = 3;

const MOVE_GOAL_PX = 36;
const VISIT_RANGE = 44;
/** Minimum seconds on read-only prompts before auto-advancing (no action required). */
const PROMPT_MIN_SEC = 4.5;

export class TutorialWalkthrough {
  step: TutorialStepId = "move";
  phase = 0;
  private moveDistance = 0;
  private visitedOrange = false;
  private visitedRed = false;
  private promptKey = "";
  private promptElapsed = 0;
  promptFade = 1;

  reset(): void {
    this.step = "move";
    this.phase = 0;
    this.moveDistance = 0;
    this.visitedOrange = false;
    this.visitedRed = false;
    this.promptKey = "";
    this.promptElapsed = 0;
    this.promptFade = 0;
  }

  private canProceedReadOnly(): boolean {
    return this.promptElapsed >= PROMPT_MIN_SEC;
  }

  stepIndex(): number {
    return STEPS.indexOf(this.step);
  }

  stepCount(): number {
    return STEPS.length;
  }

  config(): TutorialWalkthroughConfig {
    switch (this.step) {
      case "move":
        return {
          allowMove: true,
          allowSpray: false,
          allowReload: false,
          highlightStation: false,
          highlightPracticeDesk: false,
          showStageLabels: false,
        };
      case "coins":
        return {
          allowMove: true,
          allowSpray: false,
          allowReload: false,
          highlightStation: false,
          highlightPracticeDesk: false,
          showStageLabels: false,
        };
      case "extinguish":
        return {
          allowMove: true,
          allowSpray: this.phase >= 1,
          allowReload: false,
          highlightStation: false,
          highlightPracticeDesk: true,
          showStageLabels: false,
        };
      case "combo":
        return {
          allowMove: true,
          allowSpray: true,
          allowReload: false,
          highlightStation: false,
          highlightPracticeDesk: true,
          showStageLabels: false,
        };
      case "stages":
        return {
          allowMove: true,
          allowSpray: false,
          allowReload: false,
          highlightStation: false,
          highlightPracticeDesk: false,
          showStageLabels: true,
        };
      case "npc":
        return {
          allowMove: true,
          allowSpray: true,
          allowReload: false,
          highlightStation: false,
          highlightPracticeDesk: false,
          showStageLabels: false,
        };
      case "refill":
        return {
          allowMove: true,
          allowSpray: false,
          allowReload: this.phase >= 1,
          highlightStation: true,
          highlightPracticeDesk: false,
          showStageLabels: false,
        };
      case "coffee":
        return {
          allowMove: true,
          allowSpray: false,
          allowReload: false,
          highlightStation: false,
          highlightPracticeDesk: false,
          showStageLabels: false,
        };
      case "purple":
      case "green":
      case "white":
      case "rainbow":
        return {
          allowMove: true,
          allowSpray: true,
          allowReload: false,
          highlightStation: false,
          highlightPracticeDesk: true,
          showStageLabels: false,
        };
      case "done":
        return {
          allowMove: true,
          allowSpray: false,
          allowReload: false,
          highlightStation: false,
          highlightPracticeDesk: false,
          showStageLabels: false,
        };
    }
  }

  setupStep(computers: ComputerStateManager, extinguisher: ExtinguisherAmmo): void {
    computers.clearTutorialFires();

    switch (this.step) {
      case "move":
        extinguisher.reset();
        break;
      case "coins":
        extinguisher.reset();
        break;
      case "extinguish":
        extinguisher.reset();
        computers.ignite(TUTORIAL_PRACTICE);
        this.phase = 0;
        break;
      case "combo":
        extinguisher.reset();
        computers.ignite(TUTORIAL_YELLOW);
        computers.ignite(TUTORIAL_ORANGE);
        this.phase = 0;
        break;
      case "stages":
        computers.setFrozenDisplay(TUTORIAL_YELLOW, "fireYellow");
        computers.setFrozenDisplay(TUTORIAL_ORANGE, "fireOrange");
        computers.setFrozenDisplay(TUTORIAL_RED, "fireRed");
        this.visitedOrange = false;
        this.visitedRed = false;
        this.phase = 0;
        break;
      case "npc":
        computers.clearTutorialFires();
        extinguisher.reset();
        this.phase = 0;
        break;
      case "refill":
        extinguisher.reset();
        extinguisher.uses = 0;
        this.phase = 0;
        break;
      case "coffee":
        extinguisher.reset();
        this.phase = 0;
        break;
      case "purple":
        computers.ignite(TUTORIAL_PRACTICE, "purple");
        break;
      case "green":
        computers.ignite(TUTORIAL_PRACTICE, "green");
        computers.ignite(TUTORIAL_ORANGE);
        computers.ignite(TUTORIAL_RED);
        break;
      case "white":
        computers.ignite(TUTORIAL_PRACTICE, "white");
        break;
      case "rainbow":
        computers.ignite(TUTORIAL_PRACTICE, "rainbow");
        break;
      case "done":
        break;
    }
  }

  update(
    _dt: number,
    player: Player,
    computers: ComputerStateManager,
    extinguisher: ExtinguisherAmmo,
    nearStation: boolean,
    moveDelta: number,
    practiceExtinguished: boolean,
    signals: TutorialStepSignals,
  ): void {
    switch (this.step) {
      case "move":
        this.moveDistance += moveDelta;
        if (this.moveDistance >= MOVE_GOAL_PX) {
          this.advance(computers, extinguisher);
        }
        break;

      case "coins":
        if (signals.coinsCollected >= TUTORIAL_COIN_GOAL) {
          this.advance(computers, extinguisher);
        }
        break;

      case "extinguish":
        if (this.phase === 0 && this.nearPracticeDesk(player, computers)) {
          this.phase = 1;
        }
        if (this.phase >= 1 && practiceExtinguished) {
          this.advance(computers, extinguisher);
        }
        break;

      case "combo":
        if (signals.comboStreak >= 2) {
          this.advance(computers, extinguisher);
        }
        break;

      case "stages":
        if (this.phase === 0) {
          this.trackStageVisits(player, computers);
          if (this.visitedOrange && this.visitedRed) {
            this.phase = 1;
          }
        } else if (this.canProceedReadOnly()) {
          this.advance(computers, extinguisher);
        }
        break;

      case "npc":
        if (signals.npcKnocked) {
          this.advance(computers, extinguisher);
        }
        break;

      case "refill":
        if (this.phase === 0 && nearStation) {
          this.phase = 1;
        }
        if (this.phase >= 1 && extinguisher.uses >= extinguisher.maxUses) {
          this.advance(computers, extinguisher);
        }
        break;

      case "coffee":
        if (signals.coffeeCollected) {
          this.advance(computers, extinguisher);
        }
        break;

      case "purple":
      case "green":
      case "white":
      case "rainbow":
        if (practiceExtinguished) {
          this.advance(computers, extinguisher);
        }
        break;

      case "done":
        break;
    }
  }

  private advance(computers: ComputerStateManager, extinguisher: ExtinguisherAmmo): void {
    const idx = STEPS.indexOf(this.step);
    if (idx < 0 || idx >= STEPS.length - 1) return;
    this.step = STEPS[idx + 1]!;
    this.phase = 0;
    this.setupStep(computers, extinguisher);
  }

  /** Call after reset with real extinguisher reference. */
  begin(computers: ComputerStateManager, extinguisher: ExtinguisherAmmo): void {
    this.reset();
    this.setupStep(computers, extinguisher);
  }

  prompt(): TutorialPrompt {
    switch (this.step) {
      case "move":
        return { main: "Move with arrow keys or WASD", hint: "Walk around the room" };
      case "coins":
        return {
          main: "Collect the gold coins",
          hint: "Explore the office for loot",
        };
      case "extinguish":
        if (this.phase === 0) {
          return { main: "Walk up to the burning desk", hint: "Face the monitor" };
        }
        return { main: "Press Space to spray it out", hint: "Aim at the fire in front of you" };
      case "combo":
        return {
          main: "Get Both Fires Out!",
          hint: "Combo Bonus!",
        };
      case "stages":
        if (this.phase === 0) {
          return {
            main: "Fires worsen over time",
            hint: "Walk to the orange and red desks",
          };
        }
        return {
          main: "Coworkers!",
          hint: "Panic near burning PCs",
        };
      case "npc":
        return {
          main: "Spray a coworker",
          hint: "Knock them down!",
        };
      case "refill":
        if (this.phase === 0) {
          return {
            main: "Find the wall extinguisher",
            hint: "Reload station in the alcove on the right",
          };
        }
        return { main: "Press R to reload", hint: "Stand close to the canister" };
      case "coffee":
        return {
          main: "Grab the coffee on the table",
          hint: "3× movement speed for 5 seconds",
        };
      case "purple":
        return {
          main: "Purple fire — spray it out!",
          hint: "Bonus: unlimited spray for 30 seconds",
        };
      case "green":
        return {
          main: "Green fire — spray it out!",
          hint: "Bonus: clears every active fire",
        };
      case "white":
        return {
          main: "White fire — spray it out!",
          hint: "Bonus: walk through the wall below!",
        };
      case "rainbow":
        return {
          main: "Rainbow fire — spray it out!",
          hint: "Bonus: 1555 points",
        };
      case "done":
        return {
          main: "Tutorial complete!",
          hint: "Returning to title…",
        };
    }
  }

  private nearPracticeDesk(player: Player, computers: ComputerStateManager): boolean {
    const center = computers.getMonitorCenter(TUTORIAL_PRACTICE);
    if (!center) return false;
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    const dx = center.x - px;
    const dy = center.y - py;
    return dx * dx + dy * dy <= SPRAY_RANGE * SPRAY_RANGE;
  }

  private trackStageVisits(player: Player, computers: ComputerStateManager): void {
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    if (!this.visitedOrange) {
      this.visitedOrange = this.nearDesk(px, py, TUTORIAL_ORANGE, computers);
    }
    if (!this.visitedRed) {
      this.visitedRed = this.nearDesk(px, py, TUTORIAL_RED, computers);
    }
  }

  private nearDesk(
    px: number,
    py: number,
    id: ComputerId,
    computers: ComputerStateManager,
  ): boolean {
    const center = computers.getMonitorCenter(id);
    if (!center) return false;
    const dx = center.x - px;
    const dy = center.y - py;
    return dx * dx + dy * dy <= VISIT_RANGE * VISIT_RANGE;
  }

  deskLabel(id: ComputerId): string | null {
    if (this.step !== "stages") return null;
    if (id === TUTORIAL_YELLOW) return "YELLOW";
    if (id === TUTORIAL_ORANGE) return "ORANGE";
    if (id === TUTORIAL_RED) return "RED";
    return null;
  }

  /** Pixels above desk anchor (slot.y + 1) to sit label above flame. */
  labelOffset(id: ComputerId): number {
    if (id === TUTORIAL_YELLOW) return 20;
    if (id === TUTORIAL_ORANGE) return 26;
    if (id === TUTORIAL_RED) return 32;
    return 18;
  }

  tickPromptFade(dt: number): void {
    const key = `${this.step}:${this.phase}`;
    if (key !== this.promptKey) {
      this.promptKey = key;
      this.promptFade = 0;
      this.promptElapsed = 0;
    }
    this.promptElapsed += dt;
    if (this.promptFade < 1) {
      this.promptFade = Math.min(1, this.promptFade + dt / 0.5);
    }
  }

  promptAlpha(_animTime: number): number {
    const t = this.promptFade;
    return t * t * (3 - 2 * t);
  }

  practiceDeskSlotIndex(): number {
    return 0;
  }

  stationHighlightRect(): Rect {
    return TUTORIAL_STATION_ALCOVE;
  }

  stationPosition(): { x: number; y: number } | null {
    const stations = getWallExtinguishers("tutorial");
    return stations[0] ?? null;
  }
}
