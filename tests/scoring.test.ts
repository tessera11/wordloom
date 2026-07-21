// Run with:  npx tsx --test tests/scoring.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { canSpellFromWheel, submitWord, newRound, isLevelComplete } from "../src/game/scoring.ts";
import type { Level } from "../src/types.ts";

// Minimal fixture based on the real "father" level (wheel AEFHRT).
const father: Level = {
  tier: "easy", anchor: "father", wheelLetters: "aefhrt",
  gridWords: ["father", "heart", "the", "eat"],
  bonusWords: ["fear", "rate"],
  score: { placed: 4, total: 4, placementRate: 1, connected: true, rows: 3, cols: 6, density: 0.4 },
  rows: 3, cols: 6, table: [], levelNumber: 1,
  words: [
    { answer: "father", orientation: "across", startx: 1, starty: 3 },
    { answer: "heart", orientation: "across", startx: 1, starty: 1 },
    { answer: "the", orientation: "down", startx: 1, starty: 1 },
    { answer: "eat", orientation: "down", startx: 3, starty: 1 },
  ],
};

test("duplicate-safe: wheel with one T cannot spell a double-T word", () => {
  assert.equal(canSpellFromWheel("heart", "aefhrt"), true);
  assert.equal(canSpellFromWheel("hatter", "aefhrt"), false); // needs 2x T
  assert.equal(canSpellFromWheel("father", "aefhrt"), true);
});

test("grid word is recognised and marked found once", () => {
  const r = newRound();
  const res1 = submitWord("HEART", father, r, () => false);
  assert.equal(res1.kind, "grid");
  assert.equal((res1 as any).alreadyFound, false);
  const res2 = submitWord("heart", father, r, () => false);
  assert.equal((res2 as any).alreadyFound, true); // no double count
});

test("bonus accepted from pre-list OR runtime dictionary", () => {
  const r = newRound();
  assert.equal(submitWord("fear", father, r, () => false).kind, "bonus"); // pre-listed
  assert.equal(submitWord("tref", father, r, (w) => w === "tref").kind, "bonus"); // dict-only
  assert.equal(submitWord("zz", father, r, () => false).kind, "too-short"); // 2 letters
  assert.equal(submitWord("zzz", father, r, () => false).kind, "invalid-not-formable"); // no Z on wheel
  assert.equal(submitWord("frat", father, r, () => false).kind, "invalid-not-a-word"); // formable but unknown
});

test("not-formable is rejected before dictionary", () => {
  const r = newRound();
  assert.equal(submitWord("query", father, r, () => true).kind, "invalid-not-formable");
});

test("level completes only when all grid words found", () => {
  const r = newRound();
  for (const w of ["father", "heart", "the"]) submitWord(w, father, r, () => false);
  assert.equal(isLevelComplete(father, r), false);
  submitWord("eat", father, r, () => false);
  assert.equal(isLevelComplete(father, r), true);
});
