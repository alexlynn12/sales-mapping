# Handoff — this IS the app repo

If a previous attempt stalled on "no app code", this is the missing bundle. Quick confirmation you have the right one:

| | Docs bundle (wrong one) | This bundle |
|---|---|---|
| Filename | `Sales Mapping.zip` | `sales-mapping-APP.zip` |
| Size | ~17 KB (MD5 `de6321c08824cfd3fee3de21d1ffcb0f`) | ~3.3 MB |
| Expands to | `Sales Mapping/` of `.md` files | `sales-mapping/` with `index.html`, `assets/`, `data/`, `tools/`, `publish.sh` |

You are reading this file, so you have the right one — it exists only in the app bundle.

## Publish it

**Git history is already here** — two commits, `main` checked out. Do **not** run `git init`; it would orphan them.

```bash
cd sales-mapping
./publish.sh
```

That creates `alexlynn12/sales-mapping` (public), pushes, and enables Pages. Needs `gh` authenticated with **repo + workflow** scopes — `workflow` is required because `.github/workflows/pages.yml` is in the commit.

Manual equivalent:

```bash
gh repo create alexlynn12/sales-mapping --public --source=. --push
gh api -X POST repos/alexlynn12/sales-mapping/pages -f build_type=workflow
```

Live at `https://alexlynn12.github.io/sales-mapping/` about a minute later.

## Confidential data — already handled

`2027-plan.json` (real 2026 revenue) is **not in this bundle and never was**. Verify before pushing:

```bash
git ls-files | grep -i plan     # expect only data/demo-plan.json
```

`data/demo-plan.json` is synthetic — real US territory geography, randomly generated revenue, produced by `tools/make_demo.py`. Safe to publish.

Three independent guards are in place: `.gitignore` excludes `*-plan.json`, `data/*-actual.json` and `data/private/`; `publish.sh` aborts if a non-demo dataset is in `data/`; and the Pages workflow fails the build for the same reason.

## After it's live

Open the site, click **Use my data…**, pick `2027-plan.json` from disk. It loads into that browser's localStorage only — nothing is uploaded, because there is no server. Everyone else sees the demo numbers.

## Verified before shipping

Playwright, against the served build: area create / rename / delete with territory reassignment, district creation from shift-select, map picker with district targets, org-chart render with the EVP layer on and off, dataset load → reload → persistence → "back to demo" clearing localStorage, malformed-file rejection, save/load JSON round-trip byte-identical, CSV export. Zero console errors. `tools/validate_dataset.py` passes on both datasets.
