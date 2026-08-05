---
tags: [sales-mapping, moc]
type: map-of-content
---

# Sales Mapping

A browser tool for cutting sales territories into areas, grouping them into districts, and drawing the reporting org that results — with revenue, headcount and geography balanced against each other in real time.

Everything runs client-side. No server, no account, no upload.

## Start here

- [[Data model]] — the one JSON file the whole app reads, field by field
- [[Balancing method]] — why revenue, headcount and geography cannot all be even, and how the trade-off is made explicit
- [[Decisions]] — the choices baked into the tool and the reasoning behind each
- [[Roadmap]] — what is built, what is next
- [[Changelog]] — what changed when

## What it does today

| Capability | Where |
|---|---|
| Reassign a state, a territory or a planned add | click it on the map |
| Group territories under a district leader | shift-click several → *new district from these* |
| Add, rename, recolour, delete an area | click the area's name on its card |
| Name every person and set their title | click any box in the org-chart view |
| See span of control per leader | *direct reports* on each area card |
| Catch a broken cut | the checks strip — contiguity, home markets, metro splits |
| Take it elsewhere | Save JSON · Export org CSV · Print/PDF |

## The three levels

```
CRO
 └─ EVP of Sales            (optional layer, toggled in the org view)
     └─ Area leader          AVP or Area Sales Director
         ├─ District leader  optional, groups territories
         │   └─ Territory manager
         └─ Territory manager   (reports straight up when there is no district)
```

A territory not inside a district reports directly to the area leader. That is why an area card reads **direct reports = districts + direct territories** rather than headcount — headcount is the load on the *area*, direct reports is the load on the *person*.

## Related

- [[Territory adjacency]] — the hand-built graph that makes contiguity checkable
