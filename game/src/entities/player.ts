import { COLORS } from "../colors";
import {
  PLAYER_H,
  PLAYER_MAX_SPEED,
  PLAYER_RAMP_SEC,
  PLAYER_SPEED,
  PLAYER_W,
} from "../constants";
import { drawHandExtinguisher } from "./extinguisher";
import type { Input } from "../input";
import { collidesWithWalls, type Rect } from "../rooms/types";

export type Facing = "up" | "down" | "left" | "right";

const DIAG = Math.SQRT1_2;

export class Player {
  x: number;
  y: number;
  readonly w = PLAYER_W;
  readonly h = PLAYER_H;
  facing: Facing = "down";
  private moveSignX = 0;
  private moveSignY = 0;
  private holdTime = 0;

  constructor(spawn: { x: number; y: number }) {
    this.x = spawn.x;
    this.y = spawn.y;
  }

  hitbox(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  update(
    input: Input,
    walls: readonly Rect[],
    dt: number,
    speedMult = 1,
  ): void {
    let dx = 0;
    let dy = 0;

    if (input.isHeldAny(["ArrowLeft", "KeyA"])) dx -= 1;
    if (input.isHeldAny(["ArrowRight", "KeyD"])) dx += 1;
    if (input.isHeldAny(["ArrowUp", "KeyW"])) dy -= 1;
    if (input.isHeldAny(["ArrowDown", "KeyS"])) dy += 1;

    if (dx === 0 && dy === 0) {
      this.holdTime = 0;
      this.moveSignX = 0;
      this.moveSignY = 0;
      return;
    }

    const signX = Math.sign(dx);
    const signY = Math.sign(dy);
    if (signX !== this.moveSignX || signY !== this.moveSignY) {
      this.holdTime = 0;
      this.moveSignX = signX;
      this.moveSignY = signY;
    }
    this.holdTime += dt;

    if (dx !== 0 && dy !== 0) {
      dx *= DIAG;
      dy *= DIAG;
    }

    if (Math.abs(dx) >= Math.abs(dy)) {
      this.facing = dx < 0 ? "left" : "right";
    } else {
      this.facing = dy < 0 ? "up" : "down";
    }

    const ramp = Math.min(1, this.holdTime / PLAYER_RAMP_SEC);
    const eased = ramp * ramp * (3 - 2 * ramp);
    const speed =
      (PLAYER_SPEED + (PLAYER_MAX_SPEED - PLAYER_SPEED) * eased) * speedMult;
    const stepX = dx * speed * dt;
    const stepY = dy * speed * dt;

    const box = this.hitbox();
    box.x += stepX;
    if (!collidesWithWalls(box, walls)) {
      this.x += stepX;
    }

    box.x = this.x;
    box.y += stepY;
    if (!collidesWithWalls(box, walls)) {
      this.y += stepY;
    }
  }

  draw(ctx: CanvasRenderingContext2D, ghost = false): void {
    const { x, y, w, facing } = this;
    const px = Math.round(x);
    const py = Math.round(y);

    if (ghost) {
      ctx.globalAlpha = 0.55;
    }

    ctx.fillStyle = COLORS.pyroPants;
    ctx.fillRect(px + 2, py + 11, 3, 5);
    ctx.fillRect(px + 7, py + 11, 3, 5);

    ctx.fillStyle = COLORS.pyroShirt;
    ctx.fillRect(px + 1, py + 7, w - 2, 6);

    ctx.fillStyle = COLORS.pyroSkin;
    ctx.fillRect(px + 2, py + 1, 8, 7);

    ctx.fillStyle = COLORS.pyroHair;
    ctx.fillRect(px + 2, py, 8, 3);

    ctx.fillStyle = COLORS.black;
    if (facing !== "up") {
      ctx.fillRect(px + 3, py + 4, 2, 2);
      ctx.fillRect(px + 7, py + 4, 2, 2);
    }

    if (facing === "down") {
      ctx.fillStyle = COLORS.glasses;
      ctx.fillRect(px + 2, py + 5, 8, 1);
    } else if (facing === "left") {
      ctx.fillRect(px + 2, py + 4, 2, 2);
    } else if (facing === "right") {
      ctx.fillRect(px + 8, py + 4, 2, 2);
    }

    drawHandExtinguisher(ctx, px, py, facing);

    if (ghost) {
      ctx.globalAlpha = 1;
    }
  }
}
