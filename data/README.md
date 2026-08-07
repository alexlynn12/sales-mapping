# data/

`demo-plan.json` is the dataset the published app loads when you have not supplied your own. **Its revenue figures are randomly generated** — see `tools/make_demo.py`. The geography is real US sales geography, which is not confidential.

Real datasets do not go in this folder. Keep them on your machine and load them through **Use my data…**. `.gitignore` excludes `*-plan.json`, `data/*-actual.json` and `data/private/` so an accidental `git add .` cannot publish your numbers.

The format is documented in [../docs/Data model.md](../docs/Data%20model.md). Validate any dataset before trusting it:

```bash
python3 tools/validate_dataset.py path/to/dataset.json
```

## `assets/zips.json`

Not in this folder, but the same rule applies: no revenue in it, so it's safe to publish. It's a static
reference table — zip → city, state, county, lat/lon — used by the Zip codes tab, unrelated to any one
dataset. Source: [GeoNames](https://www.geonames.org) postal code export, CC BY 4.0. Regenerate with
`tools/reference/build_zips.py`.
