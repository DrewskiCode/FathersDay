import { COLORS } from "../colors";
import {
  NPC_FALLEN_SEC,
  NPC_FIRE_DETECT_RANGE,
  NPC_H,
  NPC_PATROL_SPEED,
  NPC_RUN_URGENT,
  NPC_RUN_YELLOW,
  NPC_W,
  VIEW_H,
  VIEW_W,
  WALL_THICK,
} from "../constants";
import { DESK_H, DESK_W } from "./computer";
import {
  computerId,
  isFireState,
  type ComputerStateManager,
  type ComputerVisualState,
} from "./computerState";
import type { ComputerSlot } from "../rooms/computers";
import { getComputerSlots } from "../rooms/computers";
import type { Facing, Player } from "./player";
import { collidesWithWalls, type Rect } from "../rooms/types";
import type { RoomState } from "../rooms/state";
import type { RoomId } from "../rooms/world";
import { getPlayerObstacles } from "../rooms/world";
import { inExtinguisherSprayArc } from "../systems/sprayTarget";

type WorkerPalette = {
  shirt: string;
  hair: string;
  pants: string;
};

type WorkerMode = "patrol" | "panicked";
type NavPhase = "traveling" | "loitering";

type SmokePuff = {
  x: number;
  y: number;
  vy: number;
  drift: number;
  life: number;
  maxLife: number;
  size: number;
};

type OfficeWorker = {
  room: RoomId;
  x: number;
  y: number;
  facing: Facing;
  palette: WorkerPalette;
  mode: WorkerMode;
  goalDeskIndex: number;
  panickedFromDesk: number | null;
  deskTour: number[];
  tourIndex: number;
  navPhase: NavPhase;
  loiterRemaining: number;
  loiterPickTimer: number;
  goalX: number;
  goalY: number;
  targetX: number;
  targetY: number;
  stuckTimer: number;
  lastX: number;
  lastY: number;
  fallenRemaining: number;
  knockedThisSpray: boolean;
  smokePuffs: SmokePuff[];
  smokeSpawnAcc: number;
  path: { x: number; y: number }[];
  pathIndex: number;
  pathRecalcCooldown: number;
};

const PALETTES: readonly WorkerPalette[] = [
  { shirt: "#708878", hair: COLORS.pyroHair, pants: "#484858" },
  { shirt: "#987868", hair: "#383028", pants: "#404050" },
  { shirt: "#6888a8", hair: "#282018", pants: "#383848" },
  { shirt: "#889878", hair: "#403830", pants: "#505058" },
  { shirt: "#a07888", hair: "#302820", pants: "#444450" },
];

const WORKERS_PER_ROOM: Record<"center" | "left" | "right" | "tutorial", number> = {
  center: 1,
  left: 2,
  right: 2,
  tutorial: 1,
};

const PATH_CELL = 12;
const GRID_W = Math.ceil(VIEW_W / PATH_CELL);
const GRID_H = Math.ceil(VIEW_H / PATH_CELL);
const DESK_ARRIVAL_DIST = 14;
const PATH_RECALC_SEC = 0.9;
const WAYPOINT_REACH = 8;
const STUCK_SEC = 1.2;
const STUCK_MOVE_PX = 2;
const DESK_LOITER_SEC = 3;
const LOITER_WANDER_MIN = 8;
const LOITER_WANDER_MAX = 18;
const MAX_SMOKE_PUFFS = 14;

function isUrgentFire(state: ComputerVisualState): boolean {
  return state === "fireOrange" || state === "fireRed";
}

function pickFacing(dx: number, dy: number): Facing {
  if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? "left" : "right";
  return dy < 0 ? "up" : "down";
}

function clampPos(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(WALL_THICK + 2, Math.min(VIEW_W - WALL_THICK - NPC_W - 2, x)),
    y: Math.max(WALL_THICK + 2, Math.min(VIEW_H - WALL_THICK - NPC_H - 2, y)),
  };
}

function isValidPos(x: number, y: number, obstacles: readonly Rect[]): boolean {
  return !collidesWithWalls({ x, y, w: NPC_W, h: NPC_H }, obstacles);
}

function deskCenter(slot: ComputerSlot): { x: number; y: number } {
  return { x: slot.x + DESK_W / 2, y: slot.y + DESK_H / 2 };
}

function randomDeskIndex(room: RoomId): number {
  const count = getComputerSlots(room).length;
  return Math.floor(Math.random() * count);
}

function shuffleDeskTour(room: RoomId, avoidFirst = -1): number[] {
  const count = getComputerSlots(room).length;
  const order = Array.from({ length: count }, (_, i) => i);

  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = order[i]!;
    order[i] = order[j]!;
    order[j] = tmp;
  }

  if (avoidFirst >= 0 && order[0] === avoidFirst && order.length > 1) {
    const swap = 1 + Math.floor(Math.random() * (order.length - 1));
    order[0] = order[swap]!;
    order[swap] = avoidFirst;
  }

  return order;
}

function initDeskTour(worker: OfficeWorker, startDesk: number): void {
  worker.deskTour = shuffleDeskTour(worker.room);
  const startIdx = worker.deskTour.indexOf(startDesk);
  worker.tourIndex = startIdx >= 0 ? (startIdx + 1) % worker.deskTour.length : 0;
}

function currentTourDesk(worker: OfficeWorker): number {
  return worker.deskTour[worker.tourIndex] ?? worker.goalDeskIndex;
}

function advanceTourDesk(worker: OfficeWorker): number {
  const finishedDesk = currentTourDesk(worker);
  worker.tourIndex += 1;
  if (worker.tourIndex >= worker.deskTour.length) {
    worker.deskTour = shuffleDeskTour(worker.room, finishedDesk);
    worker.tourIndex = 0;
  }
  return currentTourDesk(worker);
}

function deskStandSpots(slot: ComputerSlot, obstacles: readonly Rect[]): { x: number; y: number }[] {
  const cx = slot.x + DESK_W / 2 - NPC_W / 2;
  const cy = slot.y + DESK_H / 2 - NPC_H / 2;
  const candidates = [
    clampPos(cx, slot.y + DESK_H + 4),
    clampPos(cx, slot.y - NPC_H - 4),
    clampPos(slot.x - NPC_W - 4, cy),
    clampPos(slot.x + DESK_W + 4, cy),
  ];
  return candidates.filter((spot) => isValidPos(spot.x, spot.y, obstacles));
}

function stableStandSpot(
  deskIndex: number,
  slot: ComputerSlot,
  obstacles: readonly Rect[],
): { x: number; y: number } | null {
  const spots = deskStandSpots(slot, obstacles);
  if (spots.length === 0) return null;

  const preferred = spots[deskIndex % spots.length]!;
  if (isValidPos(preferred.x, preferred.y, obstacles)) return preferred;
  return spots[0] ?? null;
}

function setGoalToDesk(worker: OfficeWorker, deskIndex: number, obstacles: readonly Rect[]): boolean {
  const slot = getComputerSlots(worker.room)[deskIndex];
  if (!slot) return false;

  const spot = stableStandSpot(deskIndex, slot, obstacles);
  if (!spot) return false;

  worker.goalDeskIndex = deskIndex;
  worker.goalX = spot.x;
  worker.goalY = spot.y;
  worker.targetX = spot.x;
  worker.targetY = spot.y;
  worker.navPhase = "traveling";
  worker.path = [];
  worker.pathIndex = 0;
  worker.pathRecalcCooldown = 0;
  worker.stuckTimer = 0;
  worker.lastX = worker.x;
  worker.lastY = worker.y;
  return true;
}

function beginLoiter(worker: OfficeWorker): void {
  worker.navPhase = "loitering";
  worker.loiterRemaining = DESK_LOITER_SEC;
  worker.loiterPickTimer = 0;
  worker.path = [];
  worker.pathIndex = 0;
}

function pickLoiterSpot(
  worker: OfficeWorker,
  obstacles: readonly Rect[],
): void {
  const slot = getComputerSlots(worker.room)[worker.goalDeskIndex];
  if (!slot) return;

  const c = deskCenter(slot);
  const wx = worker.x + NPC_W / 2;
  const wy = worker.y + NPC_H / 2;

  for (let attempt = 0; attempt < 12; attempt++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = LOITER_WANDER_MIN + Math.random() * (LOITER_WANDER_MAX - LOITER_WANDER_MIN);
    const spot = clampPos(
      c.x + Math.cos(angle) * dist - NPC_W / 2,
      c.y + Math.sin(angle) * dist - NPC_H / 2,
    );
    if (!isValidPos(spot.x, spot.y, obstacles)) continue;

    const dx = spot.x + NPC_W / 2 - wx;
    const dy = spot.y + NPC_H / 2 - wy;
    if (dx * dx + dy * dy < 16) continue;

    worker.targetX = spot.x;
    worker.targetY = spot.y;
    worker.loiterPickTimer = 0.7 + Math.random() * 0.8;
    return;
  }

  worker.loiterPickTimer = 0.4;
}

function toCell(x: number, y: number): { cx: number; cy: number } {
  return { cx: Math.floor(x / PATH_CELL), cy: Math.floor(y / PATH_CELL) };
}

function cellToWorld(cx: number, cy: number): { x: number; y: number } {
  return clampPos(
    cx * PATH_CELL + (PATH_CELL - NPC_W) / 2,
    cy * PATH_CELL + (PATH_CELL - NPC_H) / 2,
  );
}

function isCellWalkable(cx: number, cy: number, obstacles: readonly Rect[]): boolean {
  if (cx < 0 || cy < 0 || cx >= GRID_W || cy >= GRID_H) return false;
  const { x, y } = cellToWorld(cx, cy);
  return isValidPos(x, y, obstacles);
}

function cellKey(cx: number, cy: number): string {
  return `${cx},${cy}`;
}

function heuristic(
  a: { cx: number; cy: number },
  b: { cx: number; cy: number },
): number {
  return Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy);
}

function nearestWalkableCell(
  cx: number,
  cy: number,
  obstacles: readonly Rect[],
): { cx: number; cy: number } | null {
  for (let radius = 0; radius <= 6; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
        const nx = cx + dx;
        const ny = cy + dy;
        if (isCellWalkable(nx, ny, obstacles)) return { cx: nx, cy: ny };
      }
    }
  }
  return null;
}

function reconstructPath(
  cameFrom: Map<string, { cx: number; cy: number }>,
  goalCx: number,
  goalCy: number,
): { x: number; y: number }[] {
  const cells: { cx: number; cy: number }[] = [{ cx: goalCx, cy: goalCy }];
  let current = cellKey(goalCx, goalCy);

  while (cameFrom.has(current)) {
    const prev = cameFrom.get(current)!;
    cells.push(prev);
    current = cellKey(prev.cx, prev.cy);
  }

  cells.reverse();
  return cells.slice(1).map((cell) => cellToWorld(cell.cx, cell.cy));
}

function findPath(
  startX: number,
  startY: number,
  goalX: number,
  goalY: number,
  obstacles: readonly Rect[],
): { x: number; y: number }[] {
  const start = toCell(startX, startY);
  const goal = toCell(goalX, goalY);

  if (!isCellWalkable(goal.cx, goal.cy, obstacles)) {
    const near = nearestWalkableCell(goal.cx, goal.cy, obstacles);
    if (!near) return [];
    goal.cx = near.cx;
    goal.cy = near.cy;
  }

  if (start.cx === goal.cx && start.cy === goal.cy) return [];

  const open: { cx: number; cy: number; f: number }[] = [
    { cx: start.cx, cy: start.cy, f: heuristic(start, goal) },
  ];
  const cameFrom = new Map<string, { cx: number; cy: number }>();
  const gScore = new Map<string, number>();
  gScore.set(cellKey(start.cx, start.cy), 0);

  const neighbors = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;
    const cKey = cellKey(current.cx, current.cy);

    if (current.cx === goal.cx && current.cy === goal.cy) {
      return reconstructPath(cameFrom, goal.cx, goal.cy);
    }

    const currentG = gScore.get(cKey) ?? Infinity;

    for (const { dx, dy } of neighbors) {
      const nx = current.cx + dx;
      const ny = current.cy + dy;
      if (!isCellWalkable(nx, ny, obstacles)) continue;

      const nKey = cellKey(nx, ny);
      const tentative = currentG + 1;
      if (tentative >= (gScore.get(nKey) ?? Infinity)) continue;

      cameFrom.set(nKey, { cx: current.cx, cy: current.cy });
      gScore.set(nKey, tentative);
      const f = tentative + heuristic({ cx: nx, cy: ny }, goal);
      if (!open.some((n) => n.cx === nx && n.cy === ny)) {
        open.push({ cx: nx, cy: ny, f });
      }
    }
  }

  return [];
}

function distTo(worker: OfficeWorker, x: number, y: number): number {
  const wx = worker.x + NPC_W / 2;
  const wy = worker.y + NPC_H / 2;
  const tx = x + NPC_W / 2;
  const ty = y + NPC_H / 2;
  return Math.hypot(tx - wx, ty - wy);
}

function thinPath(path: { x: number; y: number }[]): { x: number; y: number }[] {
  if (path.length <= 1) return path;

  const out: { x: number; y: number }[] = [];
  for (const point of path) {
    const prev = out[out.length - 1];
    if (!prev || Math.hypot(point.x - prev.x, point.y - prev.y) >= 20) {
      out.push(point);
    }
  }

  const last = path[path.length - 1]!;
  const tail = out[out.length - 1];
  if (!tail || tail.x !== last.x || tail.y !== last.y) {
    out.push(last);
  }

  return out;
}

function refreshPath(
  worker: OfficeWorker,
  goalX: number,
  goalY: number,
  obstacles: readonly Rect[],
): void {
  worker.path = thinPath(findPath(worker.x, worker.y, goalX, goalY, obstacles));
  worker.pathIndex = 0;
  worker.pathRecalcCooldown = PATH_RECALC_SEC;
  if (worker.path.length === 0) {
    worker.targetX = goalX;
    worker.targetY = goalY;
  }
}

function followPath(worker: OfficeWorker, obstacles: readonly Rect[], dt: number): void {
  worker.pathRecalcCooldown -= dt;

  if (worker.path.length === 0 || worker.pathRecalcCooldown <= 0) {
    refreshPath(worker, worker.goalX, worker.goalY, obstacles);
  }

  if (worker.pathIndex < worker.path.length) {
    const waypoint = worker.path[worker.pathIndex]!;
    if (distTo(worker, waypoint.x, waypoint.y) <= WAYPOINT_REACH) {
      worker.pathIndex += 1;
    }
  }

  if (worker.pathIndex < worker.path.length) {
    const waypoint = worker.path[worker.pathIndex]!;
    worker.targetX = waypoint.x;
    worker.targetY = waypoint.y;
    return;
  }

  worker.targetX = worker.goalX;
  worker.targetY = worker.goalY;
}

function tryMove(worker: OfficeWorker, nx: number, ny: number, obstacles: readonly Rect[]): number {
  const startX = worker.x;
  const startY = worker.y;
  const box: Rect = { x: worker.x, y: worker.y, w: NPC_W, h: NPC_H };

  if (Math.abs(nx) > 0.001) {
    box.x = worker.x + nx;
    box.y = worker.y;
    if (!collidesWithWalls(box, obstacles)) {
      worker.x += nx;
    }
  }

  if (Math.abs(ny) > 0.001) {
    box.x = worker.x;
    box.y = worker.y + ny;
    if (!collidesWithWalls(box, obstacles)) {
      worker.y += ny;
    }
  }

  return Math.hypot(worker.x - startX, worker.y - startY);
}

function moveToward(
  worker: OfficeWorker,
  speed: number,
  dt: number,
  obstacles: readonly Rect[],
): number {
  const dx = worker.targetX - worker.x;
  const dy = worker.targetY - worker.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return 0;

  const step = Math.min(dist, speed * dt);
  const startX = worker.x;
  const startY = worker.y;

  tryMove(worker, (dx / dist) * step, (dy / dist) * step, obstacles);
  let moved = Math.hypot(worker.x - startX, worker.y - startY);

  if (moved > 0.25) {
    worker.facing = pickFacing(dx, dy);
  }

  if (moved < 0.35) {
    if (Math.abs(dx) >= Math.abs(dy)) {
      tryMove(worker, Math.sign(dx) * step, 0, obstacles);
    } else {
      tryMove(worker, 0, Math.sign(dy) * step, obstacles);
    }
    moved = Math.hypot(worker.x - startX, worker.y - startY);
  }

  if (moved < 0.35) {
    if (Math.abs(dx) >= Math.abs(dy)) {
      tryMove(worker, 0, Math.sign(dy) * step, obstacles);
    } else {
      tryMove(worker, Math.sign(dx) * step, 0, obstacles);
    }
    moved = Math.hypot(worker.x - startX, worker.y - startY);
  }

  return moved;
}

function trackStuck(worker: OfficeWorker, dt: number, moved: number): boolean {
  if (moved >= STUCK_MOVE_PX) {
    worker.lastX = worker.x;
    worker.lastY = worker.y;
    worker.stuckTimer = 0;
    return false;
  }

  worker.stuckTimer += dt;
  return worker.stuckTimer >= STUCK_SEC;
}

function deskProximity(
  worker: OfficeWorker,
  deskIndex: number,
  computers: ComputerStateManager,
): boolean {
  const state = computers.getState(computerId(worker.room, deskIndex));
  if (!isFireState(state)) return false;

  const slot = getComputerSlots(worker.room)[deskIndex];
  if (!slot) return false;

  const c = deskCenter(slot);
  const wx = worker.x + NPC_W / 2;
  const wy = worker.y + NPC_H / 2;
  return Math.hypot(c.x - wx, c.y - wy) <= NPC_FIRE_DETECT_RANGE;
}

function findBurningDeskNearby(
  worker: OfficeWorker,
  computers: ComputerStateManager,
): number | null {
  for (let i = 0; i < getComputerSlots(worker.room).length; i++) {
    if (deskProximity(worker, i, computers)) return i;
  }
  return null;
}

function panicRunSpeed(worker: OfficeWorker, computers: ComputerStateManager): number {
  if (worker.panickedFromDesk === null) return NPC_RUN_YELLOW;
  const state = computers.getState(computerId(worker.room, worker.panickedFromDesk));
  return isUrgentFire(state) ? NPC_RUN_URGENT : NPC_RUN_YELLOW;
}

function nextDeskExcluding(worker: OfficeWorker, exclude: number): number {
  for (let step = 1; step <= worker.deskTour.length; step++) {
    const idx = (worker.tourIndex + step) % worker.deskTour.length;
    const desk = worker.deskTour[idx]!;
    if (desk !== exclude) {
      worker.tourIndex = idx;
      return desk;
    }
  }
  return worker.goalDeskIndex;
}

function enterPanic(worker: OfficeWorker, fromDesk: number, obstacles: readonly Rect[]): void {
  worker.mode = "panicked";
  worker.panickedFromDesk = fromDesk;
  worker.navPhase = "traveling";
  worker.loiterRemaining = 0;
  setGoalToDesk(worker, nextDeskExcluding(worker, fromDesk), obstacles);
}

function exitPanic(worker: OfficeWorker, obstacles: readonly Rect[]): void {
  worker.mode = "patrol";
  worker.panickedFromDesk = null;
  beginLoiter(worker);
  pickLoiterSpot(worker, obstacles);
}

function atGoal(worker: OfficeWorker): boolean {
  return distTo(worker, worker.goalX, worker.goalY) <= DESK_ARRIVAL_DIST;
}

function travelToGoal(
  worker: OfficeWorker,
  speed: number,
  obstacles: readonly Rect[],
  dt: number,
): void {
  followPath(worker, obstacles, dt);
  const moved = moveToward(worker, speed, dt, obstacles);

  if (trackStuck(worker, dt, moved)) {
    refreshPath(worker, worker.goalX, worker.goalY, obstacles);
    worker.stuckTimer = 0;
  }
}

function updateLoiter(
  worker: OfficeWorker,
  obstacles: readonly Rect[],
  dt: number,
): void {
  worker.loiterRemaining -= dt;
  worker.loiterPickTimer -= dt;

  if (worker.loiterPickTimer <= 0) {
    pickLoiterSpot(worker, obstacles);
  }

  moveToward(worker, NPC_PATROL_SPEED * 0.55, dt, obstacles);

  if (worker.loiterRemaining > 0) return;

  const nextDesk = advanceTourDesk(worker);
  setGoalToDesk(worker, nextDesk, obstacles);
}

function updatePatrol(
  worker: OfficeWorker,
  computers: ComputerStateManager,
  obstacles: readonly Rect[],
  dt: number,
): void {
  const burning = findBurningDeskNearby(worker, computers);
  if (burning !== null) {
    enterPanic(worker, burning, obstacles);
    return;
  }

  if (worker.navPhase === "loitering") {
    updateLoiter(worker, obstacles, dt);
    return;
  }

  travelToGoal(worker, NPC_PATROL_SPEED, obstacles, dt);

  if (atGoal(worker)) {
    beginLoiter(worker);
    pickLoiterSpot(worker, obstacles);
  }
}

function updatePanicked(
  worker: OfficeWorker,
  computers: ComputerStateManager,
  obstacles: readonly Rect[],
  dt: number,
): void {
  const src = worker.panickedFromDesk;
  if (src === null) {
    exitPanic(worker, obstacles);
    return;
  }

  const srcState = computers.getState(computerId(worker.room, src));
  if (!isFireState(srcState)) {
    exitPanic(worker, obstacles);
    return;
  }

  const speed = panicRunSpeed(worker, computers);
  travelToGoal(worker, speed, obstacles, dt);

  if (atGoal(worker)) {
    let nextDesk = advanceTourDesk(worker);
    if (worker.panickedFromDesk !== null && nextDesk === worker.panickedFromDesk) {
      nextDesk = advanceTourDesk(worker);
    }
    setGoalToDesk(worker, nextDesk, obstacles);
  }
}

function workerSmokeActive(worker: OfficeWorker, computers: ComputerStateManager): boolean {
  if (worker.mode !== "panicked" || worker.panickedFromDesk === null) return false;
  const state = computers.getState(computerId(worker.room, worker.panickedFromDesk));
  return isFireState(state);
}

function workerHandsUp(worker: OfficeWorker, computers: ComputerStateManager): boolean {
  if (!workerSmokeActive(worker, computers)) return false;
  const state = computers.getState(computerId(worker.room, worker.panickedFromDesk!));
  return isUrgentFire(state);
}

function updateWorkerSmoke(
  worker: OfficeWorker,
  dt: number,
  computers: ComputerStateManager,
): void {
  if (!workerSmokeActive(worker, computers)) {
    worker.smokePuffs.length = 0;
    worker.smokeSpawnAcc = 0;
    return;
  }

  worker.smokeSpawnAcc += dt;
  while (worker.smokeSpawnAcc >= 0.11 && worker.smokePuffs.length < MAX_SMOKE_PUFFS) {
    worker.smokeSpawnAcc -= 0.11;
    const hx = worker.x + NPC_W / 2;
    const hy = worker.y;
    const maxLife = 0.7 + Math.random() * 0.5;
    worker.smokePuffs.push({
      x: hx + (Math.random() - 0.5) * 5,
      y: hy - 1,
      vy: 20 + Math.random() * 16,
      drift: (Math.random() - 0.5) * 10,
      life: maxLife,
      maxLife,
      size: 2 + Math.floor(Math.random() * 2),
    });
  }

  for (const puff of worker.smokePuffs) {
    puff.y -= puff.vy * dt;
    puff.x += puff.drift * dt;
    puff.life -= dt;
  }

  let write = 0;
  for (let read = 0; read < worker.smokePuffs.length; read++) {
    if (worker.smokePuffs[read]!.life > 0) {
      worker.smokePuffs[write++] = worker.smokePuffs[read]!;
    }
  }
  worker.smokePuffs.length = write;
}

function spawnWorker(
  room: RoomId,
  deskIndex: number,
  palette: WorkerPalette,
  obstacles: readonly Rect[],
): OfficeWorker {
  const slot = getComputerSlots(room)[deskIndex];
  const spots = slot ? deskStandSpots(slot, obstacles) : [];
  const spot = spots[0] ?? clampPos(VIEW_W / 2 - NPC_W / 2, VIEW_H / 2);

  const worker: OfficeWorker = {
    room,
    x: spot.x,
    y: spot.y,
    facing: "down",
    palette,
    mode: "patrol",
    goalDeskIndex: deskIndex,
    panickedFromDesk: null,
    deskTour: [],
    tourIndex: 0,
    navPhase: "loitering",
    loiterRemaining: DESK_LOITER_SEC,
    loiterPickTimer: 0,
    goalX: spot.x,
    goalY: spot.y,
    targetX: spot.x,
    targetY: spot.y,
    stuckTimer: 0,
    lastX: spot.x,
    lastY: spot.y,
    fallenRemaining: 0,
    knockedThisSpray: false,
    smokePuffs: [],
    smokeSpawnAcc: 0,
    path: [],
    pathIndex: 0,
    pathRecalcCooldown: 0,
  };

  if (!isValidPos(worker.x, worker.y, obstacles) && spots[0]) {
    worker.x = spots[0].x;
    worker.y = spots[0].y;
  }

  initDeskTour(worker, deskIndex);
  pickLoiterSpot(worker, obstacles);
  return worker;
}

function drawStandingWorker(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  facing: Facing,
  palette: WorkerPalette,
  panic: boolean,
): void {
  ctx.fillStyle = palette.pants;
  ctx.fillRect(px + 2, py + 10, 2, 4);
  ctx.fillRect(px + 6, py + 10, 2, 4);

  ctx.fillStyle = palette.shirt;
  ctx.fillRect(px + 1, py + 6, NPC_W - 2, 5);

  ctx.fillStyle = COLORS.pyroSkin;
  ctx.fillRect(px + 2, py + 1, 6, 6);

  ctx.fillStyle = palette.hair;
  ctx.fillRect(px + 2, py, 6, 2);

  if (panic) {
    ctx.fillStyle = COLORS.pyroSkin;
    ctx.fillRect(px, py - 4, 2, 3);
    ctx.fillRect(px + 8, py - 4, 2, 3);
    ctx.fillRect(px + 1, py - 3, 2, 2);
    ctx.fillRect(px + 7, py - 3, 2, 2);
  }

  ctx.fillStyle = COLORS.black;
  if (facing !== "up" && !panic) {
    ctx.fillRect(px + 3, py + 3, 1, 1);
    ctx.fillRect(px + 6, py + 3, 1, 1);
  }
  if (facing === "down" && !panic) {
    ctx.fillStyle = COLORS.glasses;
    ctx.fillRect(px + 2, py + 4, 6, 1);
  }
}

function drawFallenWorker(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  palette: WorkerPalette,
): void {
  ctx.fillStyle = palette.shirt;
  ctx.fillRect(px, py + 6, 10, 4);
  ctx.fillStyle = palette.pants;
  ctx.fillRect(px + 10, py + 7, 4, 3);
  ctx.fillStyle = COLORS.pyroSkin;
  ctx.fillRect(px + 1, py + 4, 4, 4);
  ctx.fillStyle = palette.hair;
  ctx.fillRect(px, py + 3, 4, 2);
  ctx.fillStyle = COLORS.text;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(px + 12, py + 2, 1, 1);
  ctx.fillRect(px + 14, py + 1, 1, 1);
  ctx.fillRect(px + 13, py + 3, 1, 1);
  ctx.globalAlpha = 1;
}

function drawWorkerSmoke(ctx: CanvasRenderingContext2D, worker: OfficeWorker): void {
  for (const puff of worker.smokePuffs) {
    const t = puff.life / puff.maxLife;
    const alpha = t * 0.55;
    const s = puff.size;
    const px = Math.round(puff.x - s / 2);
    const py = Math.round(puff.y - s / 2);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = COLORS.smoke;
    ctx.fillRect(px, py, s, s);
    if (s >= 3) {
      ctx.globalAlpha = alpha * 0.45;
      ctx.fillRect(px + 1, py - 1, s - 2, s - 2);
    }
  }
  ctx.globalAlpha = 1;
}

export class OfficeWorkerManager {
  private readonly workers: OfficeWorker[] = [];

  resetTutorial(roomState: RoomState, round: number): void {
    this.workers.length = 0;
    const obstacles = getPlayerObstacles("tutorial", roomState, round, false);
    const desk = randomDeskIndex("tutorial");
    this.workers.push(spawnWorker("tutorial", desk, PALETTES[0]!, obstacles));
  }

  anyFallenInRoom(room: RoomId): boolean {
    return this.workers.some((w) => w.room === room && w.fallenRemaining > 0);
  }

  reset(roomState: RoomState, round: number): void {
    this.workers.length = 0;
    let paletteIdx = 0;

    for (const room of ["center", "left", "right"] as const) {
      const obstacles = getPlayerObstacles(room, roomState, round, false);
      const count = WORKERS_PER_ROOM[room];
      for (let i = 0; i < count; i++) {
        const desk = randomDeskIndex(room);
        const worker = spawnWorker(room, desk, PALETTES[paletteIdx]!, obstacles);
        paletteIdx += 1;
        this.workers.push(worker);
      }
    }
  }

  onSprayEnd(): void {
    for (const worker of this.workers) {
      worker.knockedThisSpray = false;
    }
  }

  update(
    dt: number,
    playerRoom: RoomId,
    computers: ComputerStateManager,
    roomState: RoomState,
    round: number,
    player: Player,
    spraying: boolean,
  ): void {
    if (spraying) {
      for (const worker of this.workers) {
        if (worker.room !== playerRoom || worker.fallenRemaining > 0 || worker.knockedThisSpray) {
          continue;
        }
        if (inExtinguisherSprayArc(player, worker.x, worker.y, NPC_W, NPC_H)) {
          worker.fallenRemaining = NPC_FALLEN_SEC;
          worker.knockedThisSpray = true;
        }
      }
    }

    for (const worker of this.workers) {
      if (worker.fallenRemaining > 0) {
        worker.fallenRemaining -= dt;
        updateWorkerSmoke(worker, dt, computers);
        continue;
      }

      const obstacles = getPlayerObstacles(worker.room, roomState, round, false);

      if (!isValidPos(worker.x, worker.y, obstacles)) {
        const slot = getComputerSlots(worker.room)[worker.goalDeskIndex];
        const spot = slot ? stableStandSpot(worker.goalDeskIndex, slot, obstacles) : null;
        if (spot) {
          worker.x = spot.x;
          worker.y = spot.y;
        }
        if (worker.navPhase === "traveling") {
          setGoalToDesk(worker, worker.goalDeskIndex, obstacles);
        }
      }

      if (worker.mode === "patrol") {
        updatePatrol(worker, computers, obstacles, dt);
      } else {
        updatePanicked(worker, computers, obstacles, dt);
      }

      updateWorkerSmoke(worker, dt, computers);
    }
  }

  draw(ctx: CanvasRenderingContext2D, room: RoomId, computers: ComputerStateManager): void {
    for (const worker of this.workers) {
      if (worker.room !== room) continue;
      const px = Math.round(worker.x);
      const py = Math.round(worker.y);
      const panic = workerHandsUp(worker, computers);

      if (worker.fallenRemaining > 0) {
        drawFallenWorker(ctx, px, py, worker.palette);
      } else {
        drawStandingWorker(ctx, px, py, worker.facing, worker.palette, panic);
      }
      drawWorkerSmoke(ctx, worker);
    }
  }
}
