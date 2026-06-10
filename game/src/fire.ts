import { COLORS } from "./colors";

/** Square pixel size for all in-game fire (title + gameplay). */
export const FIRE_PIXEL = 4;

export type FireLayer = "yellow" | "orange" | "red";

export type FirePalette = "normal" | "purple" | "green" | "white" | "rainbow";

export type FireDrawOptions = {
  /** 0–1 scales flame height/width (starts tiny, grows through stages). */
  growth?: number;
  showYellow?: boolean;
  showOrange?: boolean;
  showRed?: boolean;
  palette?: FirePalette;
};

export function fireLayerColor(layer: FireLayer): string {
  switch (layer) {
    case "yellow":
      return COLORS.fireYellow;
    case "orange":
      return COLORS.fireOrange;
    case "red":
      return COLORS.fireRed;
  }
}

function hash(a: number, b: number, t: number): number {
  const n = Math.sin(a * 127.1 + b * 311.7 + t * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Chunky square-pixel flame — grows over time; color layers accumulate by stage.
 */
export class PixelFire {
  private time = 0;

  constructor(
    readonly columns = 9,
    readonly maxRows = 14,
  ) {}

  update(dt: number): void {
    this.time += dt;
  }

  get animTime(): number {
    return this.time;
  }

  private columnHeight(c: number, growth: number): number {
    const center = (this.columns - 1) / 2;
    const dist = Math.abs(c - center) / (center + 0.5);
    const scaledMax = Math.max(2, this.maxRows * growth);
    const base = scaledMax * (0.45 + 0.55 * (1 - dist * 0.9));
    const wobble =
      Math.sin(this.time * 9 + c * 0.85) * 1.2 * growth +
      Math.sin(this.time * 14 + c * 1.6) * 0.7 * growth;
    const spark = hash(c, 0, Math.floor(this.time * 11)) > 0.72 ? 1 : 0;
    const minH = growth < 0.35 ? 1 : growth < 0.6 ? 2 : 3;
    return Math.floor(Math.min(scaledMax, Math.max(minH, base + wobble + spark)));
  }

  private layerAt(
    c: number,
    r: number,
    colHeight: number,
    opts: Required<FireDrawOptions>,
  ): FireLayer | null {
    if (r >= colHeight) return null;

    const center = (this.columns - 1) / 2;
    const dist = Math.abs(c - center) / (center + 0.5);
    const hRatio = r / Math.max(colHeight, 1);
    const tick = Math.floor(this.time * 12);

    if (hRatio > 0.85 && hash(c, r, tick) > 0.55) return null;

    if (opts.showYellow && dist < 0.28 && hRatio > 0.15 && hRatio < 0.92) {
      return "yellow";
    }
    if (opts.showOrange && dist < 0.58 && hRatio < 0.88) {
      return "orange";
    }
    if (opts.showRed) {
      return "red";
    }
    if (opts.showOrange && dist < 0.75) return "orange";
    if (opts.showYellow) return "yellow";
    return null;
  }

  /** Draw flame with bottom-center anchored at (anchorX, anchorY). */
  draw(
    ctx: CanvasRenderingContext2D,
    anchorX: number,
    anchorY: number,
    options: FireDrawOptions = {},
  ): void {
    const growth = Math.max(0.12, Math.min(1, options.growth ?? 1));
    const palette = options.palette ?? "normal";
    const opts: Required<Omit<FireDrawOptions, "palette">> & { palette: FirePalette } = {
      growth,
      showYellow: options.showYellow ?? true,
      showOrange: options.showOrange ?? true,
      showRed: options.showRed ?? true,
      palette,
    };

    const activeCols = Math.max(1, Math.ceil(this.columns * (0.35 + growth * 0.65)));
    const colStart = Math.floor((this.columns - activeCols) / 2);
    const pixel = Math.max(2, Math.round(FIRE_PIXEL * (0.5 + growth * 0.5)));
    const left = anchorX - (activeCols * pixel) / 2;
    const tick = Math.floor(this.time * 12);

    for (let ci = 0; ci < activeCols; ci++) {
      const c = colStart + ci;
      const height = this.columnHeight(c, growth);
      for (let r = 0; r < height; r++) {
        const hRatio = r / Math.max(height, 1);
        let color: string | null = null;

        if (opts.palette !== "normal") {
          if (hRatio > 0.88 && hash(c, r, tick) > 0.5) continue;
          color = specialPixelColor(opts.palette, c, r, tick);
        } else {
          const layer = this.layerAt(c, r, height, opts);
          if (!layer) continue;
          color = fireLayerColor(layer);
        }

        ctx.fillStyle = color;
        ctx.fillRect(left + ci * pixel, anchorY - (r + 1) * pixel, pixel, pixel);
      }
    }
  }
}

function specialPixelColor(
  palette: Exclude<FirePalette, "normal">,
  c: number,
  r: number,
  tick: number,
): string {
  switch (palette) {
    case "purple":
      return (c + tick) % 3 === 0 ? COLORS.firePurple : "#7848a8";
    case "green":
      return (r + tick) % 2 === 0 ? COLORS.fireGreen : "#38b838";
    case "white":
      return (c + r + tick) % 3 === 0 ? COLORS.fireWhite : "#b8c0c8";
    case "rainbow": {
      const colors = [
        COLORS.fireRainbow1,
        COLORS.fireRainbow2,
        COLORS.fireRainbow3,
        COLORS.fireRainbow4,
      ];
      return colors[(c + r * 2 + tick) % 4];
    }
  }
}
