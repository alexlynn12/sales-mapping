---
tags: [sales-mapping, log]
---

# Changelog

Related: [[Sales Mapping]] · [[Roadmap]]

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
