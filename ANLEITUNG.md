# Anleitung: Tägliche Podcast-Folge erstellen

Diese Anleitung führt die Cloud-Routine jeden Morgen aus. Arbeite sparsam mit Tokens:
Lies keine Quelltexte der Skripte, nutze keine Websuche und keine Subagenten.

Alle Befehle im Hauptordner des Repositorys ausführen.

## Schritt 1 – Vorbereitung

```bash
npm ci
DATUM=$(TZ=Europe/Berlin date +%F)
mkdir -p arbeit
```

## Schritt 2 – Schlagzeilen holen

```bash
node nachrichten_holen.mjs arbeit/lage.md 30
```

Dann `arbeit/lage.md` lesen. Die Datei enthält Titel, kurze Anrisstexte und Uhrzeiten aus
RSS-Feeds (Schöppingen, Kreis Borken, Polizei Borken, Kreis Steinfurt, Polizei Steinfurt,
tagesschau Inland/Ausland, Deutschlandfunk).

## Schritt 3 – Sprechtext schreiben

Schreibe `arbeit/skript.txt` (UTF-8, reiner Text, KEINE Überschriften, kein Markdown, keine
Aufzählungszeichen, keine URLs). Absätze durch eine Leerzeile trennen.
Länge: ca. 1.250–1.350 Wörter (= ca. 10 Minuten).

Aufbau:
1. Begrüßung mit Wochentag und Datum („Guten Morgen! Heute ist …“), ein Satz zum Ablauf.
2. Region (ca. 40 %): zuerst Schöppingen (Wohnort des Hörers), dann Kreis Borken (Ahaus, Heek,
   Gronau, Stadtlohn, Borken …), dann kurz Kreis Steinfurt (Rheine, Metelen, Horstmar …).
   Gibt es zu Schöppingen nichts Neues, mit Kreis Borken beginnen. Polizeimeldungen bündeln und
   kurz halten, schwere Unfälle/Todesfälle sachlich und respektvoll.
3. Überleitung „Damit nach Deutschland.“ – 5 bis 7 wichtigste Themen.
4. Überleitung „Damit zu den Nachrichten aus der Welt.“ – 5 bis 7 wichtigste Themen, am Ende
   ggf. „Noch einige Meldungen in Kürze“.
5. Kurzer Abschluss mit Datum und „bis morgen!“.

Regeln:
- Nur Fakten verwenden, die in `arbeit/lage.md` stehen. Nichts erfinden oder ausschmücken (keine
  erfundenen Zahlen, Verletztenangaben, Ergebnisse, Ursachen). Wenn nur ein Titel bekannt ist,
  nur das berichten, was der Titel hergibt. Unbestätigtes als Bericht kennzeichnen
  („laut Medienberichten“).
- Alles in eigenen Worten formulieren, keine Sätze aus den Quellen übernehmen.
- Fehltreffer aussortieren: andere Orte gleichen Namens (z. B. Gronau bei Bergisch Gladbach oder
  in Niedersachsen, Oldenburger Münsterland), Transfermarkt-Seiten, Werbung, alte Meldungen,
  doppelte Meldungen.
- Fürs Vorlesen schreiben: Abkürzungen ausschreiben (B 70 → Bundesstraße 70, Mrd. → Milliarden),
  keine Klammern, keine Sonderzeichen wie „|“ oder „&“, kurze Sätze.
- Danach einmal gegenlesen: Ist jede Aussage durch `arbeit/lage.md` gedeckt?
  Wortzahl prüfen mit `wc -w arbeit/skript.txt`.

Schreibe außerdem `arbeit/beschreibung.txt`: eine Zeile mit den 3–4 wichtigsten Themen, durch
Kommas getrennt (z. B. „Schöppingen: neue Rettungswache, Schüsse in Gronau, Tabaksteuer-Panne,
Ukraine-Gespräche“).

## Schritt 4 – Vertonen

```bash
node vertonen.mjs arbeit/skript.txt arbeit/folge.mp3
```

Dauert 1–3 Minuten. Schlägt es fehl, einmal erneut ausführen.

## Schritt 5 – Veröffentlichen

```bash
bash veroeffentlichen.sh arbeit/folge.mp3 "$DATUM" arbeit/beschreibung.txt
```

Das baut die Homepage neu und schreibt den Zweig `gh-pages`. Den Zweig `main` NICHT ändern:
nichts committen, nichts pushen außer über dieses Skript. Der Ordner `arbeit/` ist in
`.gitignore` und bleibt lokal.

## Schritt 6 – Rückmeldung

Antworte am Ende in 2–4 Zeilen auf Deutsch: ob die Folge veröffentlicht ist, Länge in Minuten,
die 3 Top-Themen. Bei Fehlern: was nicht geklappt hat (z. B. welcher Feed nicht erreichbar war).
