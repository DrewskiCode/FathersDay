import { gameAudio } from "../audio/sound";
import { SPECIAL_FIRE_INTERVAL } from "../constants";
import { ComputerStateManager } from "../entities/computerState";
import type { RoomId } from "../rooms/world";
import { pickRandomSpecialFire } from "./powerUps";
import {
  maxSimultaneousFires,
  roundStartFireCount,
  igniteIntervalSec,
} from "./rounds";

/** Seconds of calm after clearing all fires before the next round ignites. */
const ROUND_CLEAR_BUFFER_SEC = 4;

export class FireSpawnSystem {
  private igniteTimer = 0;
  private hadFireThisRound = false;
  private spawnCounter = 0;
  breatherRemaining = 0;
  unlockBannerRemaining = 0;
  unlockBannerText: string | null = null;
  explorePromptRemaining = 0;
  roundBannerRemaining = 0;
  roundBannerRound = 0;
  private pendingRoundAdvance = false;

  reset(): void {
    this.igniteTimer = 3;
    this.hadFireThisRound = false;
    this.spawnCounter = 0;
    this.breatherRemaining = 0;
    this.unlockBannerRemaining = 0;
    this.unlockBannerText = null;
    this.explorePromptRemaining = 0;
    this.roundBannerRemaining = 0;
    this.roundBannerRound = 0;
    this.pendingRoundAdvance = false;
  }

  private igniteDesk(
    computers: ComputerStateManager,
    target: ReturnType<ComputerStateManager["pickRandomWorkingDesk"]>,
  ): void {
    if (!target) return;
    this.spawnCounter += 1;
    const special =
      this.spawnCounter % SPECIAL_FIRE_INTERVAL === 0
        ? pickRandomSpecialFire()
        : undefined;
    computers.ignite(target, special);
    gameAudio.ignite();
  }

  beginRound(
    round: number,
    computers: ComputerStateManager,
    unlockedRooms: readonly RoomId[],
    wingMessage: string | null,
  ): void {
    const counter = { value: this.spawnCounter };
    const startCount = roundStartFireCount(round);
    if (startCount > 0) {
      computers.spawnInitialFires(
        unlockedRooms,
        startCount,
        round,
        counter,
        pickRandomSpecialFire,
      );
      this.spawnCounter = counter.value;
      this.hadFireThisRound = startCount > 0;
    } else {
      this.hadFireThisRound = false;
    }

    const interval = igniteIntervalSec(round);
    if (wingMessage) {
      this.unlockBannerText = wingMessage;
      this.unlockBannerRemaining = 8;
      this.explorePromptRemaining = 8;
      this.breatherRemaining = 1;
      this.igniteTimer = interval - 2;
    } else if (round === 4 || round === 7) {
      this.explorePromptRemaining = 6;
      this.igniteTimer = interval + 4;
    } else {
      this.igniteTimer = Math.min(this.igniteTimer, interval);
    }

    this.roundBannerRound = round;
    this.roundBannerRemaining = 2.5;
  }

  update(
    dt: number,
    round: number,
    computers: ComputerStateManager,
    unlockedRooms: readonly RoomId[],
    onRoundClear: () => void,
  ): void {
    if (this.unlockBannerRemaining > 0) {
      this.unlockBannerRemaining -= dt;
    }
    if (this.explorePromptRemaining > 0) {
      this.explorePromptRemaining -= dt;
    }

    if (this.roundBannerRemaining > 0) {
      this.roundBannerRemaining -= dt;
    }

    if (this.breatherRemaining > 0) {
      this.breatherRemaining -= dt;
      if (this.breatherRemaining <= 0 && this.pendingRoundAdvance) {
        this.pendingRoundAdvance = false;
        onRoundClear();
      }
      return;
    }

    const active = computers.countActiveFires(unlockedRooms);
    if (active > 0) {
      this.hadFireThisRound = true;
    }

    if (this.hadFireThisRound && active === 0) {
      this.hadFireThisRound = false;
      this.breatherRemaining = ROUND_CLEAR_BUFFER_SEC;
      this.pendingRoundAdvance = true;
      return;
    }

    this.igniteTimer -= dt;
    if (this.igniteTimer > 0) return;
    this.igniteTimer = igniteIntervalSec(round);

    if (active >= maxSimultaneousFires(round)) return;

    const target = computers.pickRandomWorkingDesk(unlockedRooms, round);
    if (!target) return;

    this.igniteDesk(computers, target);
    this.hadFireThisRound = true;
  }

  get showExplorePrompt(): boolean {
    return this.explorePromptRemaining > 0;
  }
}
