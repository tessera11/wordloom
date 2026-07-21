import type { Level } from "../types";

/**
 * Crossword board renderer (DOM / CSS grid).
 * Chosen over canvas for accessibility (each cell is a real element),
 * trivially animatable fills, and crisp text at any DPR.
 */
export class Board {
  el: HTMLElement;
  private cells = new Map<string, HTMLElement>(); // "r,c" -> element
  constructor(container: HTMLElement, private level: Level) {
    this.el = document.createElement("div");
    this.el.className = "board";
    this.el.style.gridTemplateColumns = `repeat(${level.cols}, 1fr)`;
    this.el.style.gridTemplateRows = `repeat(${level.rows}, 1fr)`;
    container.innerHTML = "";
    container.appendChild(this.el);
    this.render();
  }

  private key(r: number, c: number) { return `${r},${c}`; }

  private render() {
    const { rows, cols, table } = this.level;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const div = document.createElement("div");
        const hasLetter = table[r][c] !== "-";
        div.className = hasLetter ? "cell slot" : "cell empty";
        if (hasLetter) {
          div.dataset.letter = table[r][c];
          const span = document.createElement("span");
          span.className = "glyph";
          span.textContent = "";            // hidden until revealed
          div.appendChild(span);
          this.cells.set(this.key(r, c), div);
        }
        this.el.appendChild(div);
      }
    }
  }

  /** Reveal a word's cells with a stagger animation. Returns true if newly filled. */
  revealWord(word: string): boolean {
    const placed = this.level.words.find(
      (w) => w.answer.toLowerCase() === word.toLowerCase() && w.orientation !== "none"
    );
    if (!placed) return false;
    const x = placed.startx - 1, y = placed.starty - 1;
    let newly = false;
    for (let i = 0; i < placed.answer.length; i++) {
      const r = y + (placed.orientation === "down" ? i : 0);
      const c = x + (placed.orientation === "across" ? i : 0);
      const cell = this.cells.get(this.key(r, c));
      if (!cell) continue;
      const glyph = cell.querySelector<HTMLElement>(".glyph")!;
      if (!cell.classList.contains("filled")) newly = true;
      cell.classList.add("filled");
      glyph.textContent = (cell.dataset.letter ?? "").toUpperCase();
      glyph.style.animationDelay = `${i * 60}ms`;
      glyph.classList.remove("pop"); void glyph.offsetWidth; glyph.classList.add("pop");
    }
    return newly;
  }

  /** Free hint: reveal a single not-yet-filled letter. */
  revealHintLetter(): boolean {
    for (const [, cell] of this.cells) {
      if (!cell.classList.contains("filled")) {
        cell.classList.add("filled", "hint");
        const glyph = cell.querySelector<HTMLElement>(".glyph")!;
        glyph.textContent = (cell.dataset.letter ?? "").toUpperCase();
        return true;
      }
    }
    return false;
  }
}
