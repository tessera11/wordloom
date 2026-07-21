/**
 * Runtime bonus-word dictionary.
 *
 * Per the v1 decision, we bundle a broader on-device word set so players can
 * discover bonus words beyond the level's pre-computed list. This is a LOOKUP
 * set only (a Set<string>), not the generation engine — small footprint, no
 * perf risk. In production this is generated at build time from the same
 * curated SCOWL-derived + profanity/name-filtered source as the level pack,
 * then shipped as a compressed asset (e.g. dictionary.txt.gz, ~150-250KB).
 *
 * Loading strategy: fetch once, cache in memory. The board only ever queries
 * words formable from the current wheel, so even a large dictionary is a cheap
 * O(1) Set.has() per submission.
 */

let DICT: Set<string> | null = null;

export async function loadDictionary(url = "/dictionary.txt"): Promise<void> {
  if (DICT) return;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`dict ${res.status}`);
    const text = await res.text();
    DICT = new Set(
      text.split(/\r?\n/).map((w) => w.trim().toLowerCase()).filter((w) => w.length >= 3)
    );
  } catch {
    // Graceful fallback: no runtime dictionary → only pre-listed bonuses count.
    DICT = new Set();
    console.warn("[dictionary] runtime dictionary unavailable; using pre-listed bonuses only");
  }
}

export function isRealWord(word: string): boolean {
  return DICT ? DICT.has(word.toLowerCase()) : false;
}

export function dictionarySize(): number {
  return DICT ? DICT.size : 0;
}
