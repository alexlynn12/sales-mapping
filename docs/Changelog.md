---
tags: [sales-mapping, log]
---

# Changelog

Related: [[Sales Mapping]] · [[Roadmap]]

## v0.3.0 — your work survives a refresh

The dataset already persisted; the work on top of it did not. A refresh, a closed tab or a crash meant re-doing every move unless you had remembered to **Save…** first.

- Area and district assignments, every name you type, the EVP toggle, splits and coverage changes are written back to this browser after each change
- Restored automatically on the next visit, and tagged to the dataset it belongs to — a scenario built on one book is never applied to another
- The dataset bar shows when it last saved, with **Discard** to throw it away and start from the dataset as it came
- Still entirely local. It uses the same browser storage as your dataset and nothing is uploaded. It is per-browser, so **Save…** remains the way to move a scenario to another machine or send it to someone
- If storage is unavailable — private mode, or a full disk — the bar says so rather than failing silently

## v0.2.0 — territory splitting and coverage

A territory covering several states is one rep, so the whole patch moved as a unit — clicking North Dakota also moved Minnesota. Splitting was previously an upstream dataset edit; now it happens in the app.

- Split a multi-state territory in two: choose which states move, allocate the revenue, name each half and pick the area the new one lands in
- Offered from the map picker (including straight off a state, where the surprise usually happens), and from a **⑂ split** button on multi-state rows in the Territories tab
- Adds attached to the territory can move across with it
- Revenue is reallocated, never created — the dataset total is unchanged. Headcount goes up by one, because two territories are two people, and the dialog says so before you commit
- Adjacency is maintained: the halves border each other and both inherit the original's neighbours, so the contiguity check keeps working
- Undo reverses a split, including the dataset changes it made
- Scenario files carry any splits, so **Save…** / **Load…** round-trips them; **Download it** exports the dataset with the split applied
- `land` now moves with the states themselves rather than being prorated by state count, using real state areas

### Uncovered states

A state no territory covers was drawn grey and ignored every click, with nothing on screen saying why. Alaska was the only one, and it looked broken rather than deliberate.

- Grey states are now hoverable — *"no territory covers it"* — and clicking one offers **give it coverage**
- Pick a territory (nearest listed first) and the state joins that rep's patch. No revenue, no head: it stops being a hole in the map, nothing else
- The state's full area is added to that territory's `land`
- Uncovered states are listed at the top of the States tab instead of being invisible
- Undo reverses it

## v0.1.0 — first repo build

Extracted from a single 5 MB self-contained HTML file into a real application.

- Split into `index.html`, `assets/styles.css`, `assets/app.js`, `assets/boot.js`
- Data moved out of the bundle: the app now loads a dataset at runtime, from `localStorage` if you have loaded your own, otherwise from `data/demo-plan.json`
- Demo dataset with synthetic revenue so the app can be published safely
- `tools/build_dataset.py` — import a book of business from a spreadsheet
- `tools/validate_dataset.py` — index, adjacency, contiguity and totals checks
- `tools/make_demo.py` — anonymise a real dataset
- Plotly and the US topojson vendored, so the app works offline and depends on no CDN
- GitHub Pages deploy on push to `main`

### Carried over from the pre-repo tool

- Districts as an optional middle layer, with span-of-control per leader
- Org-chart view with editable names and titles and an optional EVP layer
- Area create / rename / recolour / delete, deletion reassigning territories rather than orphaning them
- Click an area's name to rename it
- Home base separated from leader name, so an area can be based somewhere while the seat is open
- Live checks and the metrics strip
