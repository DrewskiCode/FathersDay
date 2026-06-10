import {
  COFFEE_BOOST_SEC,
  COFFEE_SPAWN_CHANCE,
  COFFEE_SPEED_MULT,
  SCORE_COIN,
  VIEW_H,
  VIEW_W,
  WALL_THICK,
} from "../constants";
import type { Player } from "../entities/player";
import { getComputerCollisionRects } from "../rooms/computers";
import { CENTER_WALLS } from "../rooms/center";
import { LEFT_WALLS } from "../rooms/left";
import { RIGHT_WALLS } from "../rooms/right";
import { TUTORIAL_WALLS } from "../rooms/tutorial";
import { rectsOverlap, type Rect } from "../rooms/types";
import type { RoomId } from "../rooms/world";

export type CoffeeTableId = "center" | "left" | "right" | "tutorial";

export type CoffeeTable = {
  id: CoffeeTableId;
  room: RoomId;
  x: number;
  y: number;
};

export const COFFEE_TABLES: readonly CoffeeTable[] = [
  { id: "center", room: "center", x: 132, y: 128 },
  { id: "left", room: "left", x: 210, y: 140 },
  { id: "right", room: "right", x: 100, y: 130 },
];

export const TUTORIAL_COFFEE_TABLE: CoffeeTable = {
  id: "tutorial",
  room: "tutorial",
  x: 40,
  y: 168,
};

const ALL_COFFEE_TABLES: readonly CoffeeTable[] = [
  ...COFFEE_TABLES,
  TUTORIAL_COFFEE_TABLE,
];

const TUTORIAL_COIN_SPOTS: readonly { x: number; y: number }[] = [
  { x: 48, y: 188 },
  { x: 220, y: 188 },
  { x: 154, y: 48 },
];

type Coin = {
  room: RoomId;
  x: number;
  y: number;
  collected: boolean;
};

const COIN_SIZE = 8;
const COIN_PICKUP_PAD = 2;
const COFFEE_PICKUP_RANGE = 16;

/** Spread like decor — cleared of desks and maze walls. */
const COIN_LAYOUT: Record<Exclude<RoomId, "tutorial">, readonly { x: number; y: number }[]> = {
  center: [
    { x: 24, y: 72 },
    { x: 200, y: 72 },
    { x: 154, y: 20 },
    { x: 24, y: 196 },
    { x: 288, y: 196 },
  ],
  left: [
    { x: 72, y: 40 },
    { x: 24, y: 108 },
    { x: 24, y: 186 },
    { x: 78, y: 108 },
    { x: 118, y: 108 },
    { x: 160, y: 36 },
    { x: 160, y: 108 },
    { x: 228, y: 88 },
    { x: 210, y: 186 },
    { x: 270, y: 108 },
  ],
  right: [
    { x: 24, y: 72 },
    { x: 24, y: 144 },
    { x: 24, y: 196 },
    { x: 88, y: 96 },
    { x: 160, y: 96 },
    { x: 200, y: 72 },
    { x: 160, y: 186 },
    { x: 88, y: 196 },
    { x: 220, y: 88 },
    { x: 276, y: 144 },
  ],
};

const ROOM_WALLS: Record<RoomId, readonly Rect[]> = {
  center: CENTER_WALLS,
  left: LEFT_WALLS,
  right: RIGHT_WALLS,
  tutorial: TUTORIAL_WALLS,
};

function coinRect(x: number, y: number): Rect {
  return { x, y, w: COIN_SIZE, h: COIN_SIZE };
}

function isValidCoinSpot(room: RoomId, x: number, y: number): boolean {
  const box = coinRect(x, y);
  if (box.x < WALL_THICK || box.y < WALL_THICK) return false;
  if (box.x + box.w > VIEW_W - WALL_THICK || box.y + box.h > VIEW_H - WALL_THICK) {
    return false;
  }

  const solids = [...ROOM_WALLS[room], ...getComputerCollisionRects(room)];
  return !solids.some((solid) => rectsOverlap(box, solid));
}

export class CollectiblesManager {
  private coins: Coin[] = [];
  private readonly cupsOnTable = new Map<CoffeeTableId, boolean>();
  coffeeBoostRemaining = 0;

  reset(): void {
    this.coins = [];
    this.cupsOnTable.clear();
    this.coffeeBoostRemaining = 0;
    this.seedCoins();
  }

  resetTutorial(): void {
    this.coins = TUTORIAL_COIN_SPOTS.filter((spot) =>
      isValidCoinSpot("tutorial", spot.x, spot.y),
    ).map((spot) => ({
      room: "tutorial" as const,
      x: spot.x,
      y: spot.y,
      collected: false,
    }));
    this.cupsOnTable.clear();
    this.coffeeBoostRemaining = 0;
  }

  placeTutorialCoffee(): void {
    this.cupsOnTable.set("tutorial", true);
  }

  tutorialCoinsCollected(): number {
    return this.coins.filter((c) => c.room === "tutorial" && c.collected).length;
  }

  private seedCoins(): void {
    for (const [room, spots] of Object.entries(COIN_LAYOUT) as [
      Exclude<RoomId, "tutorial">,
      readonly { x: number; y: number }[],
    ][]) {
      for (const spot of spots) {
        if (!isValidCoinSpot(room, spot.x, spot.y)) continue;
        this.coins.push({ room, x: spot.x, y: spot.y, collected: false });
      }
    }
  }

  onRoundStart(): void {
    if (Math.random() >= COFFEE_SPAWN_CHANCE) return;

    const empty = COFFEE_TABLES.filter((table) => !this.cupsOnTable.get(table.id));
    if (empty.length === 0) return;

    const pick = empty[Math.floor(Math.random() * empty.length)]!;
    this.cupsOnTable.set(pick.id, true);
  }

  update(dt: number): void {
    if (this.coffeeBoostRemaining > 0) {
      this.coffeeBoostRemaining = Math.max(0, this.coffeeBoostRemaining - dt);
    }
  }

  get speedMultiplier(): number {
    return this.coffeeBoostRemaining > 0 ? COFFEE_SPEED_MULT : 1;
  }

  get hasCoffeeBoost(): boolean {
    return this.coffeeBoostRemaining > 0;
  }

  coinsInRoom(room: RoomId): readonly Coin[] {
    return this.coins.filter((c) => c.room === room && !c.collected);
  }

  cupOnTable(tableId: CoffeeTableId): boolean {
    return this.cupsOnTable.get(tableId) ?? false;
  }

  tablesInRoom(room: RoomId): readonly CoffeeTable[] {
    return ALL_COFFEE_TABLES.filter((t) => t.room === room);
  }

  tryCollect(
    player: Player,
    room: RoomId,
  ): { coinPoints: number; gotCoffee: boolean } {
    let coinPoints = 0;
    let gotCoffee = false;
    const box = player.hitbox();

    for (const coin of this.coins) {
      if (coin.collected || coin.room !== room) continue;
      const rect: Rect = {
        x: coin.x,
        y: coin.y,
        w: COIN_SIZE,
        h: COIN_SIZE,
      };
      const pickup: Rect = {
        x: rect.x - COIN_PICKUP_PAD,
        y: rect.y - COIN_PICKUP_PAD,
        w: rect.w + COIN_PICKUP_PAD * 2,
        h: rect.h + COIN_PICKUP_PAD * 2,
      };
      if (rectsOverlap(box, pickup)) {
        coin.collected = true;
        coinPoints += SCORE_COIN;
      }
    }

    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;

    for (const table of ALL_COFFEE_TABLES) {
      if (table.room !== room || !this.cupsOnTable.get(table.id)) continue;
      const tx = table.x + 8;
      const ty = table.y + 2;
      const dx = px - tx;
      const dy = py - ty;
      if (dx * dx + dy * dy <= COFFEE_PICKUP_RANGE * COFFEE_PICKUP_RANGE) {
        this.cupsOnTable.set(table.id, false);
        this.coffeeBoostRemaining = COFFEE_BOOST_SEC;
        gotCoffee = true;
      }
    }

    return { coinPoints, gotCoffee };
  }
}
