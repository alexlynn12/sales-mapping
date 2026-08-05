#!/usr/bin/env python3
"""Turn a real Sales Mapping dataset into a publishable demo.

Geography is kept (US metros are public knowledge and the map has to mean
something), but every commercially sensitive field is replaced:

  * revenue          -> synthetic, drawn from a seeded log-normal, rescaled to a round total
  * leader home base -> removed, every seat shown as open
  * home-market rules-> removed (they encode where named individuals live)
  * planned-add timing/role -> generalised to quarters with no year

Usage:  python3 tools/make_demo.py real-plan.json data/demo-plan.json
"""
import json
import math
import random
import sys

TARGET_TOTAL = 60_000_000
SEED = 20270101


def synth_revenue(n, rng):
    """Log-normal spread with one deliberate outlier, so the balancing problem stays interesting."""
    vals = [math.exp(rng.gauss(0.0, 0.75)) for _ in range(n)]
    vals[rng.randrange(n)] *= 6.0          # every real book has one monster territory
    scale = TARGET_TOTAL / sum(vals)
    return [round(v * scale, -3) for v in vals]


def main(src, dst):
    d = json.load(open(src))
    rng = random.Random(SEED)

    revs = synth_revenue(len(d["territories"]), rng)
    for t, r in zip(d["territories"], revs):
        t["rev"] = int(r)
    d["total"] = int(sum(t["rev"] for t in d["territories"]))

    for a in d["areas"]:
        a["leader"] = ""
        a["open"] = True
        a["core"] = []
    d["homes"] = []

    for a in d["adds"]:
        a["timing"] = "Q" + a["timing"].split()[0][-1] if a.get("timing", "").startswith("Q") else "future"
    for t in d["territories"]:
        for a in t.get("adds", []):
            a["timing"] = "future"

    d["meta"] = {
        "name": "Demo plan (synthetic)",
        "note": "Revenue figures are randomly generated. Territory geography is real US "
                "sales geography and is not confidential. Safe to publish.",
        "generated_by": "tools/make_demo.py",
        "currency": "USD",
    }
    out = {"meta": d.pop("meta")}
    out.update(d)
    json.dump(out, open(dst, "w"), indent=1)
    print(f"{dst}: {len(out['territories'])} territories, "
          f"{len(out['adds'])} planned adds, ${out['total']:,} synthetic revenue")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
