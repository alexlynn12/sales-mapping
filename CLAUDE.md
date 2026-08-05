# Sales Mapping — working notes for Claude Code

A browser tool for cutting sales territories into areas, grouping them into districts, and drawing the
reporting org that results, with revenue / headcount / geography balanced against each other live.

Vanilla JS, no build step, no framework, no server. Owner: Alex Lynn (Curonix, peripheral nerve stimulation).
Live at https://alexlynn12.github.io/sales-mapping/

## Run it

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

It **must** be served. The app fetches its dataset, so opening `index.html` from `file://` is blocked by the
browser — the app detects this and says so, but don't spend time on it.

## The files that matter

| File | What it holds |
|---|---|
| `index.html` | markup, the toolbar, the "How it works" copy |
| `assets/app.js` | everything — state, metrics, map, pickers, modals, org chart, actions |
| `assets/boot.js` | dataset resolution: your file from `localStorage`, else `data/demo-plan.json` |
| `assets/state-names.js` | static reference: state names, centroids, land areas |
| `tools/` | `build_dataset.py` (spreadsheet → JSON), `validate_dataset.py`, `make_demo.py` |
| `docs/` | the reasoning. Read `Decisions.md` before changing behaviour |

## The one distinction to hold onto: `D` vs `S`

- **`D`** is the dataset — territories, adjacency, `stateTerr`, `baseline`, totals. Loaded at runtime.
  `T` is `D.territories`, `ADD` is `D.adds`.
- **`S`** is the work — which area/district each territory sits in, every name typed, the EVP toggle.

Most actions only touch `S`. **Splitting a territory and assigning coverage to an uncovered state are the
exceptions** — they mutate `D`, which is why they need `push(true)` so undo can restore the dataset too.
Get this wrong and undo leaves `S` and `D` disagreeing about how many territories exist.

## Invariants — break these and the tool starts lying

1. **Revenue is conserved.** Splitting reallocates, never creates. `T.reduce((s,t)=>s+t.rev,0)` must equal
   `D.total` after any operation.
2. **One territory row = one head.** `stats()` counts `+1` per territory regardless of `t.heads` (that field
   is vestigial). `totalHeads` = territories + adds. Splitting therefore adds a head — surface that in the UI
   before the user commits, because it's a business decision, not a mapping one.
3. **Index discipline.** `adj`, `stateTerr`, `baseline`, `colocate`, `homes[].core` and `adds[].parent` all
   index into `territories` by position. Only ever append; never reorder or splice.
4. **Adjacency is symmetric.** Add edges in both directions or the contiguity flood-fill silently misreports.
5. **`land` follows the states.** A territory's share of a state is `STATE_LAND[st] / (territories covering st)`.

## Storage — two separate keys, both local

| Key | Holds |
|---|---|
| `salesmapping.dataset.v1` | the dataset loaded via *Use my data…* |
| `salesmapping.scenario.v1` | the work on top of it, tagged `meta.name + '|' + D.total` |

A scenario is only restored when its tag matches the loaded dataset, so work built on one book never lands on
another. Autosave is debounced off `render()`. If you add an action that mutates state without rendering, it
won't be saved.

## Confidentiality — read this before committing

The published repo carries **synthetic** numbers only (`data/demo-plan.json`, from `tools/make_demo.py`).

Never commit:
- `data/2027-plan.json` — the real book. It lives outside the repo at `../../data/2027-plan.json`
- `tools/reference/leaders_private.py`, `expand_private.py` — real leader home bases and the real expansion
  table. `leaders.py` / `expand.py` import them if present and fall back to neutral examples, so a public
  clone still runs. Gitignored via `tools/reference/*_private.py`
- Real figures **in documentation**. This is not hypothetical: the first publish leaked a real territory's
  revenue through a JSON example in `docs/Data model.md`. A `.gitignore` cannot catch that. Check prose too.

Before any push:

```bash
git ls-files | grep -iE 'plan|private'      # must return only data/demo-plan.json
```

Force-pushing does **not** remove a leaked blob from GitHub — it stays fetchable by SHA. Deleting and
recreating the repo is the only reliable fix.

## Testing

There is no test runner. Changes are verified with Playwright against a served build, driving the real
functions and asserting on real state. The pattern that works:

```js
await p.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__ds && document.querySelector('#cards .card'));
const before = await p.evaluate(() => ({ n: T.length, heads: TOTH, sum: T.reduce((s,t)=>s+t.rev,0) }));
await p.evaluate(() => doSplit(29, { /* ... */ }));
```

`window.__ds` is the live dataset and is the reliable signal that boot finished. Always assert revenue
conservation and head count, always check for console errors, and always re-run the earlier suites — the
split, coverage and autosave features interact.

## Publishing

```bash
./publish.sh          # repo create + push + Pages enable; safe to re-run
```

Two things that have bitten before:

- `gh auth login` alone is **not** enough. `git push` fails with *"could not read Username"* until
  `gh auth setup-git` installs the credential helper.
- Do **not** run `git init` in this directory. It already has history on `main`.

## Where the thinking lives

Project notes are Obsidian, at `~/Desktop/Alex's Vault/COMPANIES/Curonix/Sales Mapping/` — eleven linked
notes. `2027 area plan.md` holds the real numbers and is **confidential**. When you learn something durable,
write it there, not just into the chat.

`docs/` in this repo is the publishable subset of those notes; keep the two in step when you change behaviour.

## Facts about the book you'll otherwise re-derive

- **Killeen, TX is $7.50M** — 10.5% of the company, 4.7x the next largest territory. Whichever area holds it
  leads on revenue by construction. Splitting it was tested; it does *not* close the spread.
- **Western revenue density is roughly half** — $546k/rep against a $1,068k average. Evening headcount
  east-to-west guarantees uneven revenue, and vice versa. No cut does both.
- **Leader home bases force the West into two areas.** Idaho and Carlsbad cannot share one.
- **Arizona is the only land bridge** from Southern California to New Mexico and Texas.
- **The source workbook's Southeast Total row does not foot by $392,738.** Build from territory rows;
  the total is $71,580,197.

## Standing constraints from Alex — don't re-litigate

Killeen stays intact · strict geographic contiguity · balance revenue *and* headcount, not one ·
2027 end-state headcount (82) is the basis · planned adds carry zero revenue · Ortho Agents count in span
the same as Territory Managers.

## Next

**Scenario compare** — open two saved files side by side, diff the moves and the metrics. Agreed as the next
build. Full list in `docs/Roadmap.md`.
