# data/

`demo-plan.json` is the dataset the published app loads when you have not supplied your own. **Its revenue figures are randomly generated** — see `tools/make_demo.py`. The geography is real US sales geography, which is not confidential.

Real datasets do not go in this folder. Keep them on your machine and load them through **Use my data…**. `.gitignore` excludes `*-plan.json`, `data/*-actual.json` and `data/private/` so an accidental `git add .` cannot publish your numbers.

The format is documented in [../docs/Data model.md](../docs/Data%20model.md). Validate any dataset before trusting it:

```bash
python3 tools/validate_dataset.py path/to/dataset.json
```
