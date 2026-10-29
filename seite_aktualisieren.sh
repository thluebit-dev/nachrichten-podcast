#!/usr/bin/env bash
# Stellt eine vertonte Folge auf die Homepage (Zweig gh-pages → GitHub Pages).
# Der Zweig besteht immer nur aus einem einzigen Commit mit den neuesten Folgen,
# damit das Projekt nicht mit jeder Folge wächst. Läuft in GitHub Actions.
#
# Aufruf:  bash seite_aktualisieren.sh <folge.mp3> <JJJJ-MM-TT> [beschreibung.txt]
set -euo pipefail

MP3="$1"; DATUM="$2"; BESCHREIBUNG="${3:-}"
SEITE="$(mktemp -d)"
INDEX="$(mktemp -u)"

# Bisherige Homepage holen (beim allerersten Mal gibt es den Zweig noch nicht)
if git fetch --depth=1 origin gh-pages 2>/dev/null; then
  git archive FETCH_HEAD | tar -x -C "$SEITE"
fi

node seite_bauen.mjs "$SEITE" "$MP3" "$DATUM" "$BESCHREIBUNG"

# Einzelnen Commit aus dem Seitenordner bauen, ohne den Arbeitsordner zu berühren
export GIT_INDEX_FILE="$INDEX"
git --work-tree="$SEITE" add -A
BAUM="$(git write-tree)"
COMMIT="$(git -c user.name="Nachrichten-Podcast" -c user.email="podcast@users.noreply.github.com" \
  commit-tree "$BAUM" -m "Folge $DATUM")"
unset GIT_INDEX_FILE

git push --force origin "$COMMIT:refs/heads/gh-pages"
rm -rf "$SEITE" "$INDEX"
echo "Veröffentlicht: https://thluebit-dev.github.io/nachrichten-podcast/"
