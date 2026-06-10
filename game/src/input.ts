const PREVENT_DEFAULT = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "Space",
  "Enter",
  "KeyR",
  "KeyP",
  "Escape",
]);

export class Input {
  private readonly held = new Set<string>();
  private readonly pressed = new Set<string>();
  clickX: number | null = null;
  clickY: number | null = null;
  mouseX: number | null = null;
  mouseY: number | null = null;

  constructor() {
    window.addEventListener("keydown", (e) => {
      if (!this.held.has(e.code)) {
        this.pressed.add(e.code);
      }
      this.held.add(e.code);
      if (PREVENT_DEFAULT.has(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.held.delete(e.code);
    });
  }

  attachCanvas(canvas: HTMLCanvasElement): void {
    const toCanvasCoords = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    canvas.addEventListener("click", (e) => {
      const { x, y } = toCanvasCoords(e.clientX, e.clientY);
      this.clickX = x;
      this.clickY = y;
    });

    canvas.addEventListener("mousemove", (e) => {
      const { x, y } = toCanvasCoords(e.clientX, e.clientY);
      this.mouseX = x;
      this.mouseY = y;
    });

    canvas.addEventListener("mouseleave", () => {
      this.mouseX = null;
      this.mouseY = null;
    });
  }

  isHeld(code: string): boolean {
    return this.held.has(code);
  }

  isHeldAny(codes: readonly string[]): boolean {
    return codes.some((code) => this.held.has(code));
  }

  wasPressed(code: string): boolean {
    return this.pressed.has(code);
  }

  endFrame(): void {
    this.pressed.clear();
    this.clickX = null;
    this.clickY = null;
  }
}
