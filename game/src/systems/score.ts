import { loadHighScore, saveHighScore } from "../ui/gameOverExterior";

export class ScoreManager {
  value = 0;
  pulseRemaining = 0;
  lastGain = 0;

  reset(): void {
    this.value = 0;
    this.pulseRemaining = 0;
    this.lastGain = 0;
  }

  add(points: number): void {
    if (points <= 0) return;
    this.value += points;
    this.lastGain = points;
    this.pulseRemaining = 0.6;
    saveHighScore(this.value);
  }

  update(dt: number): void {
    if (this.pulseRemaining > 0) {
      this.pulseRemaining -= dt;
    }
  }

  get highScore(): number {
    return loadHighScore();
  }
}
