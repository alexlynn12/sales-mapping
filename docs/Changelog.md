---
tags: [sales-mapping, log]
---

# Changelog

Related: [[Sales Mapping]] · [[Roadmap]]

## v0.2.0 — territory splitting

A territory covering several states is one rep, so the whole patch moved as a unit — clicking North Dakota also moved Minnesota. Splitting was previously an upstream dataset edit; now it happens in the app.

- Split a multi-state territory in two: choose which states move, allocate the revenue, name each half and pick the area the new one lands in
- Offered from the map picker (including straight off a state, where the surprise usually happens), and from a **⑂ split** button on multi-state rows in the Territories tab
- Adds attached to the territory can move across with it
- Revenue is reallocated, never created — the dataset total is unchanged. Headcount goes up by one, because two territories are two people, and the dialog says so before you commit
- Adjacency is maintained: the halves border each other and both inherit the original's neighbours, so the contiguity check keeps working
- Undo reverses a split, including the dataset changes it made
- Scenario files carry any splits, so **Save…** / **Load…** round-trips them; **Download it** exports the dataset with the split applied

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
