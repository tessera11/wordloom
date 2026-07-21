/**
 * Swipe-to-connect letter wheel (Canvas).
 * Pointer events cover touch + mouse. Emits the current spelled word on drag
 * and the final word on release. Duplicate wheel letters are supported because
 * each node is tracked by index, not by letter.
 */

const PALETTE = {
  indigo: "#1B2A4A",
  linen: "#F4EDE4",
  amber: "#E4A853",
  sage: "#5B8A72",
  ink: "#0E1729",
};

interface Node { ch: string; x: number; y: number; idx: number; }

export class Wheel {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private nodes: Node[] = [];
  private path: number[] = [];   // indices in draw order
  private dragging = false;
  private pointer = { x: 0, y: 0 };
  private letters: string[];

  onUpdate: (word: string) => void = () => {};
  onSubmit: (word: string) => void = () => {};

  constructor(container: HTMLElement, letters: string) {
    this.letters = letters.toUpperCase().split("");
    this.canvas = document.createElement("canvas");
    this.canvas.className = "wheel";
    container.innerHTML = "";
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d")!;
    this.resize();
    window.addEventListener("resize", () => this.resize());

    this.canvas.addEventListener("pointerdown", (e) => this.start(e));
    this.canvas.addEventListener("pointermove", (e) => this.move(e));
    window.addEventListener("pointerup", () => this.end());
  }

  shuffle() {
    for (let i = this.letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.letters[i], this.letters[j]] = [this.letters[j], this.letters[i]];
    }
    this.layout(); this.draw();
  }

  private resize() {
    const size = Math.min(container_width(this.canvas), 420);
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.layout(); this.draw();
  }

  private layout() {
    const size = this.canvas.width / (window.devicePixelRatio || 1);
    const cx = size / 2, cy = size / 2, R = size * 0.36;
    this.nodes = this.letters.map((ch, i) => {
      const ang = -Math.PI / 2 + (i * 2 * Math.PI) / this.letters.length;
      return { ch, x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang), idx: i };
    });
  }

  private nodeAt(x: number, y: number): Node | null {
    const rNode = (this.canvas.width / (window.devicePixelRatio || 1)) * 0.11;
    for (const n of this.nodes) {
      if (Math.hypot(n.x - x, n.y - y) <= rNode) return n;
    }
    return null;
  }

  private localPos(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private start(e: PointerEvent) {
    this.dragging = true;
    this.path = [];
    this.canvas.setPointerCapture(e.pointerId);
    this.move(e);
  }

  private move(e: PointerEvent) {
    if (!this.dragging) return;
    const p = this.localPos(e);
    this.pointer = p;
    const n = this.nodeAt(p.x, p.y);
    if (n && !this.path.includes(n.idx)) {
      this.path.push(n.idx);
      this.onUpdate(this.currentWord());
      buzz();
    }
    this.draw();
  }

  private end() {
    if (!this.dragging) return;
    this.dragging = false;
    const word = this.currentWord();
    this.path = [];
    this.draw();
    if (word.length >= 3) this.onSubmit(word);
  }

  private currentWord(): string {
    return this.path.map((i) => this.nodes[i].ch).join("");
  }

  private draw() {
    const ctx = this.ctx;
    const size = this.canvas.width / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, size, size);

    // hub
    ctx.fillStyle = PALETTE.linen;
    roundRect(ctx, size * 0.08, size * 0.08, size * 0.84, size * 0.84, size * 0.12);
    ctx.fill();

    // trail
    if (this.path.length) {
      ctx.strokeStyle = PALETTE.amber;
      ctx.lineWidth = size * 0.035;
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.beginPath();
      this.path.forEach((idx, i) => {
        const n = this.nodes[idx];
        if (i === 0) ctx.moveTo(n.x, n.y); else ctx.lineTo(n.x, n.y);
      });
      if (this.dragging) ctx.lineTo(this.pointer.x, this.pointer.y);
      ctx.stroke();
    }

    // nodes
    const r = size * 0.09;
    this.nodes.forEach((n) => {
      const active = this.path.includes(n.idx);
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = active ? PALETTE.amber : PALETTE.sage;
      ctx.fill();
      ctx.fillStyle = active ? PALETTE.ink : PALETTE.linen;
      ctx.font = `700 ${size * 0.075}px system-ui, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(n.ch, n.x, n.y + size * 0.004);
    });
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function container_width(el: HTMLElement): number {
  const p = el.parentElement;
  return p ? p.clientWidth : 360;
}
function buzz() {
  if ("vibrate" in navigator) navigator.vibrate?.(8);
}
