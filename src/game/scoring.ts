import type { Level, PlacedWord } from "../types";

/**
 * Duplicate-letter-safe word matching.
 *
 * A swiped word is accepted against the letter wheel only if it can be spelled
 * using each physical wheel tile AT MOST ONCE. We match by consuming a
 * multiset of the wheel letters — NOT by `includes()` — so e.g. wheel
 * "AEFHRT" (father) can make "heart" but NOT "hatter" (needs two T's).
 */
export function canSpellFromWheel(word: string, wheel: string): boolean {
  const pool = new Map<string, number>();
  for (const ch of wheel.toLowerCase()) pool.set(ch, (pool.get(ch) ?? 0) + 1);
  for (const ch of word.toLowerCase()) {
    const n = pool.get(ch);
    if (!n) return false;
    pool.set(ch, n - 1);
  }
  return true;
}

export type SubmitResult =
  | { kind: "grid"; word: string; wordId: number; alreadyFound: boolean }
  | { kind: "bonus"; word: string; alreadyFound: boolean }
  | { kind: "invalid-not-formable"; word: string }
  | { kind: "invalid-not-a-word"; word: string }
  | { kind: "too-short"; word: string };

export interface RoundState {
  foundGrid: Set<string>;   // grid words already placed
  foundBonus: Set<string>;  // bonus words already discovered
}

export function newRound(): RoundState {
  return { foundGrid: new Set(), foundBonus: new Set() };
}

/**
 * Classify a submitted (swiped) word.
 *
 * @param isRealWord  runtime-dictionary check (see dictionary.ts). Used so a
 *                    player can find bonus words beyond the pre-computed set.
 */
export function submitWord(
  raw: string,
  level: Level,
  round: RoundState,
  isRealWord: (w: string) => boolean
): SubmitResult {
  const word = raw.toLowerCase().trim();
  if (word.length < 3) return { kind: "too-short", word };

  // Must be physically formable from the wheel (duplicate-safe).
  if (!canSpellFromWheel(word, level.wheelLetters)) {
    return { kind: "invalid-not-formable", word };
  }

  // Grid word?
  const gridIdx = level.gridWords.findIndex((g) => g.toLowerCase() === word);
  if (gridIdx !== -1) {
    const already = round.foundGrid.has(word);
    if (!already) round.foundGrid.add(word);
    const wordId = level.words.findIndex(
      (w: PlacedWord) => w.answer.toLowerCase() === word && w.orientation !== "none"
    );
    return { kind: "grid", word, wordId, alreadyFound: already };
  }

  // Bonus: accept pre-computed bonuses OR anything the runtime dictionary
  // confirms is a real word (the "broader runtime dictionary" decision).
  const isPreListed = level.bonusWords.some((b) => b.toLowerCase() === word);
  if (isPreListed || isRealWord(word)) {
    const already = round.foundBonus.has(word);
    if (!already) round.foundBonus.add(word);
    return { kind: "bonus", word, alreadyFound: already };
  }

  return { kind: "invalid-not-a-word", word };
}

/** Level is complete when every grid word has been found. */
export function isLevelComplete(level: Level, round: RoundState): boolean {
  return level.gridWords.every((g) => round.foundGrid.has(g.toLowerCase()));
}

/** Simple, defensible scoring: 10 per grid-word letter, 2 per bonus-word letter. */
export function computeScore(round: RoundState): number {
  let s = 0;
  for (const w of round.foundGrid) s += w.length * 10;
  for (const w of round.foundBonus) s += w.length * 2;
  return s;
}
