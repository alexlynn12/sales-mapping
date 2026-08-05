# Sales Mapping

Plan sales areas, districts and the reporting org on one map — with revenue, headcount and geography balanced against each other in real time.

**Live app:** https://alexlynn12.github.io/sales-mapping/

Runs entirely in your browser. No server, no account, nothing uploaded.

---

## What it does

- **Cut areas on a map.** Click a state, a territory or a planned add to move it. Every metric updates as you go.
- **Group into districts.** Shift-click several territories, group them under a district leader, and watch span of control drop.
- **Build the org.** Switch to the org-chart view, name everyone, toggle an EVP layer, print it or export it as CSV.
- **Split a territory that spans several states.** One rep covering three states moves as one unit, which is usually right and occasionally not. Split it, choose which states go where, allocate the revenue, and the two halves become two seats.
- **Get told when a cut is broken.** Contiguity, leaders' home markets, same-metro pairs and detached headcount are checked continuously.

## Your data

The published app ships with **synthetic** numbers (`data/demo-plan.json`) so it is safe to host and share.

To use your own: **Use my data…** in the dataset bar, pick your JSON file. It is stored in that browser only — it never leaves your machine, because there is nowhere for it to go. "Back to demo" clears it.

Build a dataset from a spreadsheet:

```bash
python3 tools/build_dataset.py book.xlsx my-plan.json --name "FY27 plan"
python3 tools/validate_dataset.py my-plan.json
```

The format is documented in [docs/Data model.md](docs/Data%20model.md). Keep real datasets out of the repo — `.gitignore` already excludes `data/*-actual.json` and `data/private/`.

## Publishing

```bash
./publish.sh
```

Creates the repo, pushes, and switches on GitHub Pages. Needs the [GitHub CLI](https://cli.github.com) and `gh auth login`. Safe to re-run — it reuses an existing repo and refuses to publish if a non-demo dataset is sitting in `data/`.

## Running it locally

The app fetches its dataset, so opening `index.html` straight off disk will be blocked by the browser. Serve the folder:

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

## Deploying

Pushing to `main` publishes to GitHub Pages via `.github/workflows/pages.yml`. Enable it once under **Settings → Pages → Source → GitHub Actions**.

## Layout

```
index.html                 app shell
assets/app.js              the editor — state, map, org chart, checks
assets/boot.js             dataset resolution and privacy boundary
assets/styles.css
vendor/                    plotly.min.js + US topojson (no CDN dependency)
data/demo-plan.json        synthetic dataset, published
tools/build_dataset.py     spreadsheet -> dataset
tools/validate_dataset.py  index, adjacency, contiguity and totals checks
tools/make_demo.py         real dataset -> anonymised demo
tools/reference/           coordinates, states, land area, adjacency, planned adds
docs/                      an Obsidian-ready vault folder — method, decisions, roadmap
```

## Docs

`docs/` is written as an Obsidian vault folder with wikilinks. Symlink or clone it into your vault and it stays current as the app changes. Start at [docs/Sales Mapping.md](docs/Sales%20Mapping.md).

## Licence

MIT — see [LICENSE](LICENSE).
