---
name: verify
description: How to run and verify the Ledger calendar app end-to-end (dev server, browser drive, gotchas)
---

# Verifying Ledger (myCalendar)

## Launch
- `npm run dev` (uses `next dev --webpack`). The user often already has a dev server on port 3000 — check first (`lsof -i :3000`); a second instance exits with "Another next dev server is already running". Just use http://localhost:3000.
- Auth: Firebase Google sign-in. In the user's Chrome (claude-in-chrome tools) the session is already signed in as opyjocodes@gmail.com — no login needed.

## Gotchas
- **PWA service worker serves stale bundles.** After code changes, a plain reload can show old UI. Hard reload (`cmd+shift+r`) to pick up the new build.
- **Keyboard shortcuts after reload:** synthesized key events (e.g. cmd+k) don't register until you click once inside the page to give it focus.
- **`<input type=date>` fields** (event/todo forms) garble typed dates via the computer tool. Use `find` to get the input ref, then `form_input` with an ISO value like `2026-07-03`.
- `npm run lint` has ~5 pre-existing errors (setState-in-effect in calendar-page/command-palette/migration-dialog/data-provider, unescaped entity in event-form) — only new errors matter.
- `npm run build` regenerates `public/sw.js` (expected diff noise).

## Flows worth driving
- Month/Week/Todos toggle in the panel header; Todos shows quick-add + grouped list (Overdue/Today/Upcoming/No date/Done).
- ⌘K command palette (Actions incl. "Go to todos"); `?` shortcuts help; keys 1/2/3 switch views; N adds event.
- Data is Firestore realtime — verify persistence by reloading; toasts (sonner) confirm saves/deletes with Undo actions.
