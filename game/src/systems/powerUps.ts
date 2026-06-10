import { POWERUP_DURATION_SEC } from "../constants";

export type PowerUpKind = "purple" | "green" | "white";

export type SpecialFireKind = PowerUpKind | "rainbow";

export class PowerUpState {
  unlimitedSpray = 0;
  ghostWalls = 0;
  banner: string | null = null;
  bannerRemaining = 0;

  reset(): void {
    this.unlimitedSpray = 0;
    this.ghostWalls = 0;
    this.banner = null;
    this.bannerRemaining = 0;
  }

  update(dt: number): void {
    if (this.unlimitedSpray > 0) this.unlimitedSpray = Math.max(0, this.unlimitedSpray - dt);
    if (this.ghostWalls > 0) this.ghostWalls = Math.max(0, this.ghostWalls - dt);
    if (this.bannerRemaining > 0) {
      this.bannerRemaining -= dt;
      if (this.bannerRemaining <= 0) this.banner = null;
    }
  }

  get hasUnlimitedSpray(): boolean {
    return this.unlimitedSpray > 0;
  }

  get hasGhostWalls(): boolean {
    return this.ghostWalls > 0;
  }

  activatePurple(): void {
    this.unlimitedSpray = POWERUP_DURATION_SEC;
    this.showBanner("UNLIMITED SPRAY!");
  }

  activateWhite(): void {
    this.ghostWalls = POWERUP_DURATION_SEC;
    this.showBanner("GHOST WALK!");
  }

  showBanner(text: string): void {
    this.banner = text;
    this.bannerRemaining = 2.5;
  }
}

export function pickRandomSpecialFire(): SpecialFireKind {
  const types: SpecialFireKind[] = ["purple", "green", "white", "rainbow"];
  return types[Math.floor(Math.random() * types.length)];
}
