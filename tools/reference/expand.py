"""Planned headcount adds — capacity for the coming year, carrying zero current revenue.

Each add is welded to the existing territory whose geography it sits in, so it moves
with that territory when the area lines are redrawn.

A real expansion table is commercially sensitive: it names the markets you are about
to enter, when, and why. Keep it in `expand_private.py` next to this file — that
filename is gitignored. If it is present it wins; otherwise the illustrative table
below is used, so the importer runs out of the box on a fresh clone.

Each ADDS row is:
    (market, role, timing, parent territory, state, lat, lon, rationale)
"""

# Illustrative only — replace via expand_private.py
ADDS = [
    ("Example Metro North", "TM",          "future", "Dallas Ft Worth", "TX", 32.76,  -97.33, "Example row"),
    ("Example Metro East",  "TM or Agent", "future", "Chicago",         "IL", 41.88,  -87.63, "Example row"),
    ("Example Metro West",  "Ortho Agent", "future", "Los Angeles",     "CA", 34.05, -118.24, "Example row"),
]

ORDER = ["future"]

try:  # a real table, if one is present locally
    from expand_private import ADDS, ORDER  # type: ignore  # noqa: F401,F811
except ImportError:
    pass


def weights():
    """Effective end-state headcount carried by each existing territory."""
    w = {}
    for row in ADDS:
        parent = row[3]
        w[parent] = w.get(parent, 1) + 1
    return w


if __name__ == '__main__':
    from collections import Counter
    from data import TERR
    names = {t[1] for t in TERR}
    bad = [a[3] for a in ADDS if a[3] not in names]
    print("unmatched parents:", bad or "none")
    w = weights()
    print(f"{len(ADDS)} adds -> {len(TERR)}+{len(ADDS)} = {len(TERR)+len(ADDS)} heads")
    print("by timing:", dict(Counter(a[2] for a in ADDS)))
    print("by role:  ", dict(Counter(a[1] for a in ADDS)))
    print("\nterritories that gain heads:")
    for t, n in sorted(w.items(), key=lambda kv: -kv[1]):
        kids = [a[0] for a in ADDS if a[3] == t]
        print(f"   {t:28s} 1 -> {n}   ({', '.join(kids)})")
