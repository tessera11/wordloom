# WordLoom — Project Status

_Last updated: 21 Jul 2026_

## Where things stand

| Milestone | Status |
|---|---|
| PRD → validated 170-level pack | ✅ |
| WordLoom brand + icons | ✅ |
| Full PWA client built + tested | ✅ |
| Pushed to GitHub | ✅ |
| **Live on Cloudflare Pages** | ✅ `wordloom-9up.pages.dev` |
| Auto-deploy on push | ✅ (Connect to Git) |

From here, any change is just `git add . && git commit -m "..." && git push` — live in ~2 min.

## Live URL
🔗 https://wordloom-9up.pages.dev/

## Deploy workflow (recap)
- **Production:** pushes to `main` → auto-deploy to `wordloom-9up.pages.dev`.
- **Previews:** pushes to any other branch → unique preview URL (safe playtesting).
- **Rollback:** Cloudflare dashboard → project → Deployments → pick a good build → Rollback.

## Open threads to finish v1
- [ ] **Scale to 300 levels** — needs the `build-level-pack.mjs` generator + its
      dictionary/frequency inputs. Regenerate with the name difference-filter
      baked in at generation time (see README — naive names-subtraction over-filters).
- [ ] **Regenerate the 12 flagged grid-word levels** with names blocklisted
      (the genuine `han` / `eric` / `vera` leaks).
- [ ] **Ship the real curated runtime dictionary** (SCOWL-derived, name/profanity
      filtered) as a compressed asset, replacing the 1,997-word starter.
- [ ] **Wordmark clip fix** + full favicon/splash set (cosmetic).
- [ ] **Playtest the wheel gesture** on real touch devices; tune hit-radius.

## Deferred to later phases (per PRD)
- Accounts, cross-device sync, leaderboards.
- Coin economy / power-up store.
- Ads, IAP, monetisation (v1 is PWA-first, monetise later).
- Native TWA wrapper (Bubblewrap, mirroring Tessera v1.5).
