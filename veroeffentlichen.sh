#!/usr/bin/env bash
# Reicht den fertigen Sprechtext ein: legt ihn unter skripte/ ab und pusht ihn nach main.
# Den Rest erledigt GitHub Actions (.github/workflows/folge.yml): vertonen und die
# Homepage aktualisieren. Die Cloud-Routine kann nicht selbst vertonen, weil ihr
# Netzwerk-Proxy die WebSocket-Verbindung zum Sprachdienst nicht zuverlässig durchlässt.
#
# Aufruf:  bash veroeffentlichen.sh <skript.txt> <JJJJ-MM-TT> <beschreibung.txt>
set -euo pipefail

SKRIPT="$1"; DATUM="$2"; BESCHREIBUNG="$3"
[[ "$DATUM" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || { echo "Datum muss JJJJ-MM-TT sein"; exit 1; }

mkdir -p skripte
cp "$SKRIPT" "skripte/$DATUM.txt"
cp "$BESCHREIBUNG" "skripte/$DATUM.beschreibung.txt"

git add "skripte/$DATUM.txt" "skripte/$DATUM.beschreibung.txt"
git -c user.name="Nachrichten-Podcast" -c user.email="podcast@users.noreply.github.com" \
  commit -q -m "Sprechtext $DATUM"

# Bis zu drei Versuche, falls main zwischenzeitlich geändert wurde
for versuch in 1 2 3; do
  if git push -q origin HEAD:main; then
    echo "Eingereicht: skripte/$DATUM.txt – GitHub vertont und veröffentlicht die Folge in ca. 3–5 Minuten."
    echo "Status: https://github.com/thluebit-dev/nachrichten-podcast/actions"
    exit 0
  fi
  git pull -q --rebase origin main
done
echo "Push nach main fehlgeschlagen."
exit 1
