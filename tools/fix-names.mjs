#!/usr/bin/env node
/**
 * fix-names.mjs — closes the proper-noun leak flagged in step2-findings.md.
 *
 * The step-2 pack leaked names the hand-rolled blocklist missed (eric, vera,
 * noah, han → 18 occurrences across 2,041 words). Rather than patch them one
 * by one, this filters the pack against a real common-names dataset.
 *
 * USAGE (run BEFORE regenerating to 300, and as a post-filter on any pack):
 *   node tools/fix-names.mjs \
 *        --pack ../src/data/level-pack.json \
 *        --names names-blocklist.txt \
 *        --out  ../src/data/level-pack.clean.json
 *
 * Behaviour:
 *  - Removes any BONUS word that is a listed name (safe: bonuses are optional).
 *  - FLAGS (does not silently drop) any GRID word that is a name, because
 *    removing a grid word can break the crossword. Those levels should be
 *    regenerated with the name in the generator's blocklist instead.
 */
import { readFileSync, writeFileSync } from "node:fs";

function arg(flag, def) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : def;
}

const packPath = arg("--pack", "../src/data/level-pack.json");
const namesPath = arg("--names", "names-blocklist.txt");
const outPath = arg("--out", "../src/data/level-pack.clean.json");

const pack = JSON.parse(readFileSync(packPath, "utf8"));
const names = new Set(
  readFileSync(namesPath, "utf8")
    .split(/\r?\n/).map((s) => s.trim().toLowerCase()).filter(Boolean)
);

let bonusRemoved = 0;
const gridFlags = [];

for (const lvl of pack) {
  lvl.bonusWords = (lvl.bonusWords ?? []).filter((w) => {
    if (names.has(w.toLowerCase())) { bonusRemoved++; return false; }
    return true;
  });
  for (const gw of lvl.gridWords ?? []) {
    if (names.has(gw.toLowerCase())) {
      gridFlags.push({ level: lvl.levelNumber, anchor: lvl.anchor, word: gw });
    }
  }
}

writeFileSync(outPath, JSON.stringify(pack, null, 2));

console.log(`✔ bonus name-words removed: ${bonusRemoved}`);
if (gridFlags.length) {
  console.log(`⚠ ${gridFlags.length} GRID words are names — regenerate these levels with the name blocklisted in the generator:`);
  for (const f of gridFlags) console.log(`   L${f.level} (${f.anchor}): "${f.word}"`);
} else {
  console.log("✔ no grid words are names — pack is clean");
}
console.log(`→ wrote ${outPath}`);
