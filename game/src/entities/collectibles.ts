import { COLORS } from "../colors";
import type { CoffeeTable } from "../systems/collectibles";

const COIN_SIZE = 8;

export function drawCoin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  animTime: number,
): void {
  const bob = Math.sin(animTime * 4 + x * 0.1) * 1;
  const py = Math.round(y + bob);

  ctx.fillStyle = COLORS.coinDark;
  ctx.fillRect(x, py + 2, COIN_SIZE, COIN_SIZE - 2);
  ctx.fillStyle = COLORS.coinGold;
  ctx.fillRect(x + 1, py, COIN_SIZE - 2, COIN_SIZE - 1);
  ctx.fillStyle = COLORS.coinShine;
  ctx.fillRect(x + 2, py + 1, 3, 2);
}

export function drawCoffeeTable(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
): void {
  ctx.fillStyle = COLORS.coffeeTable;
  ctx.fillRect(x, y, 16, 4);
  ctx.fillStyle = COLORS.coffeeTableDark;
  ctx.fillRect(x + 2, y + 4, 2, 5);
  ctx.fillRect(x + 12, y + 4, 2, 5);
}

export function drawCoffeeCup(
  ctx: CanvasRenderingContext2D,
  table: CoffeeTable,
): void {
  const x = table.x + 5;
  const y = table.y - 5;
  ctx.fillStyle = COLORS.coffeeCup;
  ctx.fillRect(x, y + 2, 6, 4);
  ctx.fillStyle = COLORS.coffee;
  ctx.fillRect(x + 1, y + 3, 4, 2);
  ctx.fillStyle = COLORS.coffeeCup;
  ctx.fillRect(x + 5, y + 1, 2, 2);
  ctx.fillRect(x + 2, y, 4, 2);
}
