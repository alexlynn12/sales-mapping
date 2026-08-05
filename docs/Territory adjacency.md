---
tags: [sales-mapping, reference]
---

# Territory adjacency

Related: [[Data model]] · [[Balancing method]]

The contiguity check needs to know which territories touch. There is no reliable way to derive this — territories are named business units, not polygons, and two that share a state line may be a day's drive apart while two in the same metro are ten minutes apart. So the graph is built by hand, in `tools/reference/geo.py`, and it is the most valuable hand-made asset in the repo.

## How it works

`ADJ` maps a territory name to the names it borders. The build symmetrises it, so listing an edge once is enough — but listing both directions makes the file easier to read and `validate_dataset.py` reports one-way edges as a warning rather than silently repairing them.

Flood-filling from any member of an area and comparing the reached set to the full membership is what produces the red *not geographically contiguous* flag.

## Judgement calls it encodes

The graph is opinionated, and the opinions matter more than they look:

- **Land bridges.** Whether two regions connect through a sparse state determines whether a whole cut is legal. Removing one edge can make an otherwise sensible area impossible; adding one can hide a real travel problem.
- **Distributor and direct pairs** in the same city are adjacent to each other and share the city's other edges.
- **Multi-state territories** border everything any of their states border, unless the drive genuinely isn't there.

## When you edit it

1. Change `tools/reference/geo.py`
2. Rebuild the dataset
3. Run `tools/validate_dataset.py` — it reports one-way edges, orphans and disconnected pieces
4. Re-check every existing saved scenario, because an edge you removed may have been holding one together

An edge is a claim that a single person can cover both. If you would not ask a rep to drive it, it is not an edge.
