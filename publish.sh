#!/usr/bin/env bash
# Publish Sales Mapping to GitHub and turn on Pages. Safe to re-run.
#
#   ./publish.sh                 # creates alexlynn12/sales-mapping, public
#   ./publish.sh my-repo-name    # different name
#
# Needs the GitHub CLI:  https://cli.github.com  (brew install gh)

set -euo pipefail

REPO="${1:-sales-mapping}"

command -v gh >/dev/null || {
  echo "The GitHub CLI is not installed."
  echo "  macOS:   brew install gh"
  echo "  Windows: winget install GitHub.cli"
  echo "  Linux:   see https://cli.github.com"
  exit 1
}

gh auth status >/dev/null 2>&1 || {
  echo "Not signed in to GitHub. Run:  gh auth login"
  exit 1
}

OWNER=$(gh api user --jq .login)
echo "==> Publishing as $OWNER/$REPO"

# Refuse to publish real revenue data
if compgen -G "data/*-actual.json" >/dev/null || [ -d data/private ]; then
  echo "!! A non-demo dataset is present in data/. Move it out before publishing."
  exit 1
fi
if ! git check-ignore -q data/demo-plan.json 2>/dev/null; then :; fi

# Repo
if gh repo view "$OWNER/$REPO" >/dev/null 2>&1; then
  echo "==> Repo already exists, reusing it"
else
  echo "==> Creating the repo"
  gh repo create "$OWNER/$REPO" --public \
    --description "Plan sales areas, districts and the reporting org on one map. Runs entirely in your browser." \
    --homepage "https://$OWNER.github.io/$REPO/"
fi

# Remote + push
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "https://github.com/$OWNER/$REPO.git"
else
  git remote add origin "https://github.com/$OWNER/$REPO.git"
fi

echo "==> Pushing main"
git push -u origin main

# Pages, via the Actions workflow already in .github/workflows/pages.yml
echo "==> Enabling GitHub Pages"
gh api -X POST "repos/$OWNER/$REPO/pages" -f build_type=workflow >/dev/null 2>&1 \
  || gh api -X PUT "repos/$OWNER/$REPO/pages" -f build_type=workflow >/dev/null 2>&1 \
  || echo "   (Pages may already be on — check Settings → Pages)"

URL="https://$OWNER.github.io/$REPO/"
echo
echo "==> Pushed. The deploy workflow is running now."
echo "    Watch it:   gh run watch --repo $OWNER/$REPO"
echo "    Live in ~1-2 min at:"
echo "    $URL"
echo
echo "    The published app carries synthetic demo numbers only."
echo "    Load your real dataset in the browser via 'Use my data…'."
