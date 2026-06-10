import { Game } from "./game";
import { Input } from "./input";

const canvas = document.getElementById("game");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Missing #game canvas");
}

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Could not get 2D context");
}

const input = new Input();
input.attachCanvas(canvas);
const game = new Game(ctx);
let last = performance.now();

function frame(now: number): void {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  game.update(input, dt);
  game.draw();
  input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
