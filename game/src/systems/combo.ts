import { COMBO_WINDOW_SEC } from "../constants";

/** Consecutive extinguishes within COMBO_WINDOW_SEC boost score. */
export class ComboState {
  streak = 0;
  private elapsedSinceLast = COMBO_WINDOW_SEC + 1;

  reset(): void {
    this.streak = 0;
    this.elapsedSinceLast = COMBO_WINDOW_SEC + 1;
  }

  update(dt: number): void {
    if (this.streak <= 0) return;
    this.elapsedSinceLast += dt;
    if (this.elapsedSinceLast > COMBO_WINDOW_SEC) {
      this.streak = 0;
    }
  }

  /** Seconds left to chain another extinguish before the streak resets. */
  get windowRemaining(): number {
    if (this.streak <= 0) return 0;
    return Math.max(0, COMBO_WINDOW_SEC - this.elapsedSinceLast);
  }

  get isWindowActive(): boolean {
    return this.streak > 0 && this.elapsedSinceLast <= COMBO_WINDOW_SEC;
  }

  /** Multiplier for the current extinguish (1.0 = no bonus). */
  multiplier(): number {
    if (this.streak < 2) return 1;
    return 1 + (this.streak - 1) * 0.1;
  }

  /** Call when a fire is extinguished; returns streak after increment. */
  onExtinguish(): number {
    if (this.elapsedSinceLast > COMBO_WINDOW_SEC) {
      this.streak = 1;
    } else {
      this.streak += 1;
    }
    this.elapsedSinceLast = 0;
    return this.streak;
  }

  apply(points: number): number {
    return Math.round(points * this.multiplier());
  }
}
