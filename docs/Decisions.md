---
tags: [sales-mapping, decisions]
---

# Decisions

Choices baked into the tool, and why. Revisit these when something feels wrong — usually the assumption is what's wrong, not the code.

Related: [[Sales Mapping]] · [[Balancing method]] · [[Data model]]

## Product

**No server, ever.** Territory revenue and org structure are among the more sensitive things a sales org has. A static page with client-side state means there is no database to breach, no account to manage, no vendor to trust. The cost is that sharing a *scenario* means sharing a file rather than a link — an acceptable trade.

**Data is separate from the app.** The published site carries synthetic numbers. Your dataset is loaded from disk and kept in that browser's `localStorage`. This is what makes it safe to host the app publicly and share it.

**Work is kept in the browser, but a scenario is still a file.** Losing an afternoon's work to a stray refresh is indefensible, so the current state is written to `localStorage` after every change and restored on the next visit. That is a convenience, not a filing system: it is one slot, tied to one dataset, in one browser. **Save…** stays the way to keep a scenario, name it, compare it or send it to someone.

**Everything is editable, nothing is inferred.** The tool never renames an area for you, never auto-assigns a leader, never silently rebalances. It tells you what's broken and leaves the decision where it belongs.

## Structure

**Three levels, with the middle one optional.** Area → district → territory. A territory with no district reports straight to the area leader. Most orgs need districts in one or two dense areas and nowhere else; forcing a uniform depth would be worse than allowing the ragged version.

**Direct reports, not headcount, is the span metric.** Headcount is the load on the area. Direct reports — districts plus unassigned territories — is the load on the human being.

**Planned adds follow their territory by default.** An add is capacity in a market, and the market belongs to a territory. Detaching is possible and flagged, because an add that has drifted away from its parent is nearly always an accident.

**Adds carry zero revenue.** They are 2027 capacity, not 2026 production. Counting them in revenue would flatter whichever area is growing fastest.

## Checks

**Contiguity is checked, not enforced.** A non-contiguous area is flagged in red and you can still build it — sometimes a deliberate exception (an island market, a named-account carve-out) is correct. Blocking it would be presumptuous; not mentioning it would be negligent.

**Home markets and metro pairs are warnings.** Same reasoning. They encode facts about specific people, and people move.

## Presentation

**Colour is validated for colour-blindness through seven areas.** The palette was searched in OKLCH space for perceptual separation under deuteranopia, protanopia and tritanopia as well as normal vision. Past seven, separation can no longer be guaranteed, so the app says so and leans on labels.

**Light and dark are separate palettes.** A hue that reads clearly on white washes out on near-black. Each area has a matched pair.

**Dot size is √revenue.** Linear sizing makes one large territory swallow the map; square-root keeps the outlier visible as an outlier without hiding its neighbours.

## Open questions

- Should splitting a territory be modelled in-app, rather than handled upstream in the dataset?
- Is there a useful "what would balance look like if I ignored home bases?" mode, or does that just invite plans nobody can staff?
- Should scenarios be diffable — two saved files, one comparison view?
