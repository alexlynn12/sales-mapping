---
tags: [sales-mapping, method]
---

# Balancing method

Related: [[Sales Mapping]] · [[Decisions]] · [[Data model]]

## The three things that pull against each other

Cutting a book into areas means balancing at least three quantities at once:

1. **Revenue** — so quota and comp land fairly
2. **Headcount** — so no leader's span of control is impossible
3. **Geography** — so nobody spends their life on a plane

They conflict, and not mildly. A dense metro cluster is high revenue, high headcount, small footprint. A western area is the mirror image. Even them out on any one axis and the other two get worse.

**Any tool that shows you one number is hiding the trade-off.** That's why the app puts revenue spread, revenue variance and heads-per-area side by side, and why each card shows revenue *and* heads *and* direct reports.

## Where the real constraints come from

Three kinds of constraint, in descending order of how absolute they are:

**Hard — contiguity.** An area whose territories don't touch each other isn't an area, it's two areas with one leader. The app checks this continuously by flood-filling the adjacency graph ([[Territory adjacency]]) and flags a break in red.

**Hard in practice — leader home bases.** Two leaders who live 700 miles apart cannot share an area, whatever the numbers say. Encoded as `homes[]`, each with the `core` territories that must stay in that leader's area.

**Hard in practice — metro integrity.** Territories that are two halves of one metro (a north/south split of the same city) must not land in different areas. Encoded as `colocate[]`.

Add these and the solution space shrinks fast. That is the point: they are real, and a plan that ignores them is fiction.

## The concentration problem

Two patterns recur in any book big enough to need areas, and neither is fixable by redrawing lines:

- **One territory dwarfs the rest.** When a single seat is 10% of the company, whichever area holds it is the top area — full stop. Splitting it is a business decision about that market, not a mapping decision.
- **Revenue density varies by region.** If western reps produce half what eastern reps produce, then evening *headcount* across east and west guarantees uneven *revenue*, and evening revenue guarantees uneven headcount. There is no cut that does both.

When you hit either, the honest move is to pick which axis matters more this year and say so out loud — not to keep shuffling territories.

## Reading the metrics

| Metric | What it tells you | Watch for |
|---|---|---|
| Revenue spread (max ÷ min) | how far apart the extremes are | above ~2x, the top and bottom areas are different jobs |
| Widest revenue variance | worst area's distance from the average | asymmetry — one outlier vs everyone drifting |
| Heads per area | span-of-control range | the max, not the range |
| Direct reports (per card) | load on that one person | above ~12, the area needs a district |
| Revenue per head | productivity of the area's seats | a low figure with high headcount means capacity, not performance |

## Districts change the arithmetic

Adding a district layer doesn't change revenue balance at all — it changes *span*. An area with 17 heads and no districts puts 17 people on one leader. The same 17 in three districts puts 3 on the leader and 5–6 on each district manager. Use districts where the headcount is real and the geography is coherent; don't use them to paper over an area that is simply too big.
