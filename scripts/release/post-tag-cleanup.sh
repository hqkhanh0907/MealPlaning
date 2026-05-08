#!/usr/bin/env bash
#
# scripts/release/post-tag-cleanup.sh
#
# After tagging a release (e.g. v0.2.1), push tag + main, then prune local
# branches that have already been merged. Idempotent and safe — only deletes
# branches whose tip is reachable from origin/main.
#
# Usage:
#   scripts/release/post-tag-cleanup.sh v0.2.1
#
# Per investigation 2026-05-08 §G4 — prevents data-loss risk from local-only
# tags and reduces stale-branch noise.

set -euo pipefail

TAG="${1:-}"
if [[ -z "$TAG" ]]; then
  echo "usage: $0 <tag>" >&2
  exit 2
fi

if ! git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "✗ tag $TAG does not exist locally" >&2
  exit 1
fi

echo "→ pushing main + $TAG to origin..."
git push origin main
git push origin "$TAG"

echo "→ fetching + pruning remote refs..."
git fetch --prune origin

echo "→ scanning merged local branches..."
MAIN_SHA="$(git rev-parse origin/main)"
DELETED=0
while IFS= read -r br; do
  br="${br//[[:space:]]/}"
  [[ -z "$br" || "$br" == "main" || "$br" == "*main" ]] && continue
  if git merge-base --is-ancestor "$br" "$MAIN_SHA"; then
    echo "  ✓ deleting merged branch: $br"
    git branch -D "$br" >/dev/null
    DELETED=$((DELETED + 1))
  else
    echo "  · keeping unmerged: $br"
  fi
done < <(git for-each-ref --format='%(refname:short)' refs/heads/)

echo "✓ post-tag cleanup done — deleted $DELETED merged branch(es)."
