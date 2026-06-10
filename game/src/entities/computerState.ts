import { PixelFire } from "../fire";
import { DESK_W } from "./computer";
import { getComputerSlots } from "../rooms/computers";
import type { RoomId } from "../rooms/world";
import {
  FIRE_ORANGE_SEC,
  FIRE_RED_EXPLODE_SEC,
  FIRE_YELLOW_SEC,
  OFF_ROOM_FIRE_RATE,
  SCORE_NORMAL,
  SCORE_RAINBOW,
  SCORE_SPECIAL,
} from "../constants";
import { maxFiresPerRoom, fireStageSpeed } from "../systems/rounds";
import type { FireDrawOptions } from "../fire";
import type { SpecialFireKind } from "../systems/powerUps";

export type FireStage = "fireYellow" | "fireOrange" | "fireRed";

export type SpecialFireVisual =
  | "firePurple"
  | "fireGreen"
  | "fireWhite"
  | "fireRainbow";

/** Screen visual — working, normal fire stages, or special power-up fires. */
export type ComputerVisualState = "working" | FireStage | SpecialFireVisual;

export type ComputerId = `${RoomId}-${number}`;

export function computerId(room: RoomId, index: number): ComputerId {
  return `${room}-${index}`;
}

const STAGES: FireStage[] = ["fireYellow", "fireOrange", "fireRed"];

const STAGE_LIMITS: Record<FireStage, number> = {
  fireYellow: FIRE_YELLOW_SEC,
  fireOrange: FIRE_ORANGE_SEC,
  fireRed: FIRE_RED_EXPLODE_SEC,
};

const STAGE_GROWTH_BASE = [0.22, 0.52, 0.82];
const STAGE_GROWTH_PEAK = [0.48, 0.78, 1.0];

const SPECIAL_VISUAL: Record<SpecialFireKind | "rainbow", SpecialFireVisual> = {
  purple: "firePurple",
  green: "fireGreen",
  white: "fireWhite",
  rainbow: "fireRainbow",
};

type DeskFire = {
  stage: FireStage | null;
  special: SpecialFireKind | "rainbow" | null;
  stageElapsed: number;
  flame: PixelFire;
  frozen: boolean;
};

export function isFireState(state: ComputerVisualState): state is Exclude<ComputerVisualState, "working"> {
  return state !== "working";
}

export function isSpecialFire(state: ComputerVisualState): state is SpecialFireVisual {
  return (
    state === "firePurple" ||
    state === "fireGreen" ||
    state === "fireWhite" ||
    state === "fireRainbow"
  );
}

export function firePoints(state: ComputerVisualState): number {
  switch (state) {
    case "fireRainbow":
      return SCORE_RAINBOW;
    case "firePurple":
    case "fireGreen":
    case "fireWhite":
      return SCORE_SPECIAL;
    default:
      return SCORE_NORMAL;
  }
}

export function specialKindFromState(state: ComputerVisualState): SpecialFireKind | "rainbow" | null {
  switch (state) {
    case "firePurple":
      return "purple";
    case "fireGreen":
      return "green";
    case "fireWhite":
      return "white";
    case "fireRainbow":
      return "rainbow";
    default:
      return null;
  }
}

function parseComputerId(id: ComputerId): { room: RoomId; index: number } {
  const [room, indexStr] = id.split("-") as [RoomId, string];
  return { room, index: Number(indexStr) };
}

/** Per-desk visuals, progression, and desk-top flames. */
export class ComputerStateManager {
  private readonly states = new Map<ComputerId, ComputerVisualState>();
  private readonly deskFires = new Map<ComputerId, DeskFire>();
  private time = 0;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.states.clear();
    this.deskFires.clear();
    this.time = 0;

    for (const room of ["left", "center", "right", "tutorial"] as const) {
      getComputerSlots(room).forEach((_, index) => {
        this.states.set(computerId(room, index), "working");
      });
    }
  }

  update(
    dt: number,
    round: number,
    playerRoom: RoomId,
    onRedExplode: (id: ComputerId) => void,
  ): void {
    this.time += dt;
    const speed = fireStageSpeed(round);

    for (const [id, fire] of this.deskFires) {
      fire.flame.update(dt);
      if (fire.frozen || fire.special) continue;

      const { room } = parseComputerId(id);
      const roomRate = room === playerRoom ? 1 : OFF_ROOM_FIRE_RATE;
      fire.stageElapsed += dt * speed * roomRate;

      const stage = fire.stage!;
      const limit = STAGE_LIMITS[stage];
      if (fire.stageElapsed < limit) continue;

      if (stage === "fireRed") {
        onRedExplode(id);
        return;
      }

      const next = STAGES[STAGES.indexOf(stage) + 1];
      fire.stage = next;
      fire.stageElapsed = 0;
      this.states.set(id, next);
    }
  }

  get animTime(): number {
    return this.time;
  }

  getState(id: ComputerId): ComputerVisualState {
    return this.states.get(id) ?? "working";
  }

  getDeskFlame(id: ComputerId): PixelFire | null {
    return this.deskFires.get(id)?.flame ?? null;
  }

  getFireDrawOptions(id: ComputerId): FireDrawOptions | null {
    const fire = this.deskFires.get(id);
    if (!fire) return null;

    if (fire.special) {
      const palette =
        fire.special === "rainbow"
          ? "rainbow"
          : fire.special === "purple"
            ? "purple"
            : fire.special === "green"
              ? "green"
              : "white";
      return {
        growth: 0.68,
        palette,
        showYellow: true,
        showOrange: true,
        showRed: palette === "rainbow",
      };
    }

    const stageIndex = STAGES.indexOf(fire.stage!);
    const limit = STAGE_LIMITS[fire.stage!];
    const t = Math.min(1, fire.stageElapsed / (limit * 0.85));
    const base = STAGE_GROWTH_BASE[stageIndex];
    const peak = STAGE_GROWTH_PEAK[stageIndex];
    const growth = base + (peak - base) * t;

    return {
      growth,
      showYellow: stageIndex >= 0,
      showOrange: stageIndex >= 1,
      showRed: stageIndex >= 2,
    };
  }

  ignite(id: ComputerId, special?: SpecialFireKind | "rainbow"): boolean {
    if (this.getState(id) !== "working") return false;

    if (special) {
      const visual = SPECIAL_VISUAL[special];
      this.states.set(id, visual);
      this.deskFires.set(id, {
        stage: null,
        special,
        stageElapsed: 0,
        flame: new PixelFire(5, 7),
        frozen: false,
      });
      return true;
    }

    this.states.set(id, "fireYellow");
    this.deskFires.set(id, {
      stage: "fireYellow",
      special: null,
      stageElapsed: 0,
      flame: new PixelFire(5, 8),
      frozen: false,
    });
    return true;
  }

  /** Frozen display fire for tutorial — fixed stage, no progression. */
  setFrozenDisplay(id: ComputerId, stage: FireStage): void {
    const limit = STAGE_LIMITS[stage];
    this.states.set(id, stage);
    this.deskFires.set(id, {
      stage,
      special: null,
      stageElapsed: limit * 0.7,
      flame: new PixelFire(5, 8),
      frozen: true,
    });
  }

  isFrozen(id: ComputerId): boolean {
    return this.deskFires.get(id)?.frozen ?? false;
  }

  clearTutorialFires(): void {
    for (const id of this.listFireDesksInRoom("tutorial")) {
      this.extinguish(id);
    }
  }

  extinguish(id: ComputerId): number {
    const state = this.getState(id);
    if (!isFireState(state)) return 0;
    const points = firePoints(state);
    this.states.set(id, "working");
    this.deskFires.delete(id);
    return points;
  }

  extinguishAll(rooms: readonly RoomId[]): number {
    let total = 0;
    for (const room of rooms) {
      for (const id of this.listFireDesksInRoom(room)) {
        total += this.extinguish(id);
      }
    }
    return total;
  }

  countActiveFires(rooms: readonly RoomId[]): number {
    let n = 0;
    for (const room of rooms) {
      n += this.countActiveFiresInRoom(room);
    }
    return n;
  }

  countActiveFiresInRoom(room: RoomId): number {
    let n = 0;
    getComputerSlots(room).forEach((_, index) => {
      if (isFireState(this.getState(computerId(room, index)))) n++;
    });
    return n;
  }

  pickRandomWorkingDesk(rooms: readonly RoomId[], round: number): ComputerId | null {
    const perRoomCap = maxFiresPerRoom(round);
    const candidates: ComputerId[] = [];

    for (const room of rooms) {
      if (perRoomCap !== null && this.countActiveFiresInRoom(room) >= perRoomCap) {
        continue;
      }
      getComputerSlots(room).forEach((_, index) => {
        const id = computerId(room, index);
        if (this.getState(id) === "working") candidates.push(id);
      });
    }

    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  spawnInitialFires(
    rooms: readonly RoomId[],
    count: number,
    round: number,
    spawnCounter: { value: number },
    pickSpecial: () => SpecialFireKind | "rainbow" | undefined,
  ): void {
    for (let i = 0; i < count; i++) {
      const target = this.pickRandomWorkingDesk(rooms, round);
      if (!target) break;
      spawnCounter.value += 1;
      const special =
        spawnCounter.value % 5 === 0 ? pickSpecial() : undefined;
      this.ignite(target, special);
    }
  }

  getMonitorCenter(id: ComputerId): { x: number; y: number } | null {
    const { room, index } = parseComputerId(id);
    const slot = getComputerSlots(room)[index];
    if (!slot) return null;
    return { x: slot.x + DESK_W / 2, y: slot.y + 4 };
  }

  listFireDesksInRoom(room: RoomId): ComputerId[] {
    return getComputerSlots(room)
      .map((_, index) => computerId(room, index))
      .filter((id) => isFireState(this.getState(id)));
  }
}
