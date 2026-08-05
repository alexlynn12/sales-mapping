#!/usr/bin/env python3
"""Check a Sales Mapping dataset before you trust it.

    python3 tools/validate_dataset.py data/demo-plan.json

Verifies the things the app assumes and would otherwise fail on quietly:
indices in range, the adjacency graph symmetric and fully connected, every
planned add pointing at a real territory, totals that actually add up, and
every area's starting territory set geographically contiguous.
Exit code is 1 if anything failed.
"""
import json
import sys
from collections import deque


def main(path):
    d = json.load(open(path))
    T, A = d["territories"], d["areas"]
    n = len(T)
    errs, warns = [], []

    for k in ("territories", "areas", "adj", "stateTerr", "adds", "baseline", "palette",
              "total", "totalHeads"):
        if k not in d:
            errs.append(f"missing key: {k}")
    if errs:
        return report(errs, warns)

    if len(d["baseline"]) != n:
        errs.append(f"baseline has {len(d['baseline'])} entries, {n} territories")
    if any(not (0 <= b < len(A)) for b in d["baseline"]):
        errs.append("baseline points at an area index that does not exist")

    adj = {int(k): v for k, v in d["adj"].items()}
    for i, ns in adj.items():
        if not (0 <= i < n):
            errs.append(f"adjacency key {i} out of range")
        for j in ns:
            if not (0 <= j < n):
                errs.append(f"adjacency {i} -> {j} out of range")
            elif i not in adj.get(j, []):
                warns.append(f"one-way adjacency: {T[i]['name']} -> {T[j]['name']}")
    missing_adj = [T[i]["name"] for i in range(n) if not adj.get(i)]
    if missing_adj:
        errs.append(f"no neighbours at all: {', '.join(missing_adj)}")

    # whole graph connected? an island would make some cut impossible to balance
    seen, q = {0}, deque([0])
    while q:
        x = q.popleft()
        for y in adj.get(x, []):
            if y not in seen:
                seen.add(y)
                q.append(y)
    if len(seen) != n:
        warns.append(f"adjacency graph is in {n - len(seen) + 1}+ disconnected pieces "
                     f"({', '.join(T[i]['name'] for i in range(n) if i not in seen)})")

    for j, a in enumerate(d["adds"]):
        if not (0 <= a.get("parent", -1) < n):
            errs.append(f"planned add '{a.get('market')}' has no valid parent territory")

    tot = sum(t["rev"] for t in T)
    if tot != d["total"]:
        errs.append(f"total is {d['total']:,} but territories sum to {tot:,}")
    if d["totalHeads"] != n + len(d["adds"]):
        errs.append(f"totalHeads is {d['totalHeads']} but {n} territories + "
                    f"{len(d['adds'])} adds = {n + len(d['adds'])}")

    pal = d["palette"]
    if len(pal["light"]) != len(pal["dark"]):
        errs.append("palette light/dark lengths differ")
    if len(A) > len(pal["light"]):
        errs.append(f"{len(A)} areas but only {len(pal['light'])} colours")
    if pal.get("validated", 0) > len(pal["light"]):
        errs.append("palette.validated exceeds the number of colours")

    # each area's starting set contiguous
    for ai, a in enumerate(A):
        mem = [i for i, b in enumerate(d["baseline"]) if b == ai]
        if not mem:
            warns.append(f"area '{a['name']}' starts with no territories")
            continue
        s, q2 = {mem[0]}, deque([mem[0]])
        ms = set(mem)
        while q2:
            x = q2.popleft()
            for y in adj.get(x, []):
                if y in ms and y not in s:
                    s.add(y)
                    q2.append(y)
        if len(s) != len(mem):
            warns.append(f"area '{a['name']}' does not start contiguous "
                         f"({len(mem) - len(s)} territories detached)")

    for st, ids in d["stateTerr"].items():
        for i in ids:
            if not (0 <= i < n):
                errs.append(f"stateTerr[{st}] references territory {i}")

    print(f"{path}: {n} territories, {len(A)} areas, {len(d['adds'])} planned adds, "
          f"{d['totalHeads']} heads, ${tot:,}")
    return report(errs, warns)


def report(errs, warns):
    for w in warns:
        print("  warn  " + w)
    for e in errs:
        print("  FAIL  " + e)
    if not errs and not warns:
        print("  ok    everything checks out")
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "data/demo-plan.json"))
