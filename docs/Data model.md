---
tags: [sales-mapping, reference]
---

# Data model

One JSON file describes a whole book of business. The app reads it and holds everything else — your edits — in memory until you save.

Related: [[Sales Mapping]] · [[Balancing method]] · [[Territory adjacency]]

## Top level

| Key | Type | What it is |
|---|---|---|
| `meta` | object | `name`, `note`, `currency` — free-form, shown in the dataset bar |
| `territories` | array | one entry per existing seat, in a fixed order that every index below refers to |
| `areas` | array | the starting cut — name, colour pair, leader, home base |
| `adj` | object | territory index → array of adjacent territory indices |
| `stateTerr` | object | state code → territory indices covering it |
| `adds` | array | planned headcount, flattened, each pointing at a parent territory |
| `baseline` | array | territory index → starting area index; `Reset` returns here |
| `palette` | object | `light[]`, `dark[]`, `validated` (how many are colour-blind-safe) |
| `homes` | array | leader home-market rules the checks enforce |
| `colocate` | array | index pairs that must never be split (same metro) |
| `uncovered` | array | state codes shaded grey — no territory covers them; assignable in the app |
| `total`, `totalHeads`, `k` | number | revenue sum, seats including adds, starting area count |

## A territory

```json
{
  "name": "Dallas Ft Worth",
  "lat": 32.78, "lon": -96.80,
  "rev": 3251599,
  "land": 65308,
  "states": ["TX"],
  "old": "Central",
  "area": 3,
  "heads": 2,
  "adds": [{ "market": "Fort Worth", "role": "TM or Agent", "timing": "Q1 2027",
             "lat": 32.76, "lon": -97.33 }],
  "nAdds": 1
}
```

A territory created by splitting another also carries `splitFrom`, the name of the one it came out of — the Territories tab shows it as a **split** tag.

`rev` is the trailing-year figure the balance is measured against. `land` is the territory's share of each state it covers — a state split between three territories contributes a third of its square mileage to each. `old` is the pre-cut area, used only to mark rows as *moved*.

## A planned add

Adds carry **no revenue** — they are capacity, not production. By default an add follows its parent territory wherever that territory goes, which is almost always what you want. Detach one in the map picker or the Planned adds tab and the app flags the split until you relink it.

## Index discipline

`adj`, `stateTerr`, `baseline`, `colocate`, `homes[].core` and `adds[].parent` all index into `territories` by position. Reorder that array and everything silently points at the wrong place. `tools/validate_dataset.py` exists to catch exactly this.

## Where a dataset comes from

```bash
python3 tools/build_dataset.py book.xlsx out.json --name "FY27 plan"
python3 tools/validate_dataset.py out.json
```

The importer joins the spreadsheet to the reference tables in `tools/reference/` — coordinates, states covered, land area, adjacency, planned adds. A territory the tables don't know about stops the build rather than being dropped.

## Splitting a territory

Splitting is the one action that edits the dataset rather than just the scenario. It appends a territory, moves the chosen states' entries in `stateTerr` to the new index, adds adjacency edges both ways, extends `baseline`, and raises `totalHeads` by one. `total` does not move — revenue is reallocated between the two halves, not created.

Because the dataset changes, a saved scenario that contains a split carries an `_ds` block with the affected arrays, so it can be reopened against the original dataset and still line up. Files without `_ds` are loaded as before, and are rejected if their territory count no longer matches the dataset.

## Privacy

The published app carries `data/demo-plan.json`, whose revenue is synthetic (`tools/make_demo.py`). Real datasets are never committed. **Use my data…** reads a file from disk into `localStorage` on that one browser; nothing leaves the machine.
