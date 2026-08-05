---
tags: [sales-mapping, planning]
---

# Roadmap

Related: [[Sales Mapping]] · [[Changelog]] · [[Decisions]]

## Built

- [x] Map view — click a state, territory or planned add to reassign it
- [x] Shift-click multi-select → group into a district
- [x] Areas: add, rename, recolour, delete with territory reassignment
- [x] Districts: create, rename, move between areas, delete
- [x] Org-chart view with editable names and titles, optional EVP layer
- [x] Live checks — contiguity, home markets, metro pairs, detached adds
- [x] Save/Load scenario JSON · Export org CSV · Print to PDF
- [x] Light and dark palettes, colour-blind validated to seven areas
- [x] Dataset separated from app; import from spreadsheet; validator
- [x] **Territory splitting in-app** — divide a multi-state territory, allocate its revenue, place each half

## Next

- [ ] **Scenario compare** — open two saved files side by side, diff the moves and the metrics
- [ ] **Quota view** — per-area and per-rep targets derived from the cut, exportable
- [ ] **Undo history panel** — see and jump back to any prior state, not just one step at a time
- [ ] **Drive-time colouring** — shade by distance from the leader's base rather than raw land area

## Later

- [ ] Multiple books in one dataset (e.g. by product line) with a switcher
- [ ] Shareable read-only scenario link, encoded in the URL fragment so nothing is uploaded
- [ ] Optimiser: suggest a cut given weights on revenue / heads / land, respecting the hard constraints
- [ ] Assignment history — who owned this territory when

## Deliberately not doing

- Accounts, logins, a backend. See [[Decisions]].
- Auto-rebalancing without asking. The tool surfaces the trade-off; the human makes the call.
