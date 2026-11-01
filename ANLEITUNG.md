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

Dann `arbeit/lage.md` lesen. Die Datei ist nach den Teilen des Podcasts gegliedert
(Überschriften mit Nummer 1–8): Schöppingen, Nachbarorte, Kreis Borken, NRW (WDR),
Deutschland, Europa, Welt (tagesschau, Deutschlandfunk) und am Ende die Wettervorhersage für
heute und morgen an sieben Orten in NRW.

Lies außerdem den Sprechtext von gestern, falls vorhanden:

```bash
cat skripte/$(TZ=Europe/Berlin date -d yesterday +%F).txt 2>/dev/null | head -c 12000
```

Themen, die gestern schon vorkamen, nicht noch einmal erzählen – außer es gibt eine echte
Neuigkeit dazu (dann nur das Neue, mit einem Halbsatz Erinnerung).

## Schritt 3 – Sprechtext schreiben

Schreibe `arbeit/skript.txt` (UTF-8, reiner Text, KEINE Überschriften, kein Markdown, keine
Aufzählungszeichen, keine URLs). Absätze durch eine Leerzeile trennen.
Länge: ca. 1.350–1.450 Wörter (= ca. 11 Minuten), davon ca. 120–150 Wörter Wetter.

Aufbau – genau in dieser Reihenfolge:
1. Begrüßung mit Wochentag und Datum („Guten Morgen! Heute ist …“), ein Satz zum Ablauf.
2. **Schöppingen** (Wohnort des Hörers, inkl. Ortsteil Eggerode) – der wichtigste Teil, so
   ausführlich, wie die Meldungen es hergeben (ca. 25 %). Jede Schöppinger Meldung aufgreifen,
   auch kleine (Vereine, Gemeinderat, Menschen, Veranstaltungen, Sport). Westfälische Nachrichten
   und Radio WMW haben Vorrang, weil sie Kurztexte liefern. Gibt es wenig Neues, ist der Teil
   eben kurz – nichts dazuerfinden und nichts aus anderen Orten nach Schöppingen verlegen.
3. **Nachbarorte** (ca. 15 %): Heek mit Nienborg, Asbeck und Legden. Metelen und Horstmar nur
   kurz und nur, wenn etwas Nennenswertes passiert ist.
4. **Kreis Borken** (ca. 8 %): nur kreisweite Themen (Kreisverwaltung, Kreistag, Verkehr,
   Gesundheit, Wirtschaft) und wirklich Herausragendes. KEINE gewöhnlichen Polizeimeldungen aus
   anderen Städten des Kreises (Bocholt, Gronau, Borken …).
5. Überleitung „Damit nach Nordrhein-Westfalen.“ – **NRW** (ca. 12 %): 3 bis 5 Themen aus den
   WDR-Meldungen, Landespolitik zuerst. Bundesliga nur in einem Satz.
6. Überleitung „Damit nach Deutschland.“ – **Deutschland** (ca. 15 %): 4 bis 6 wichtigste Themen.
7. Überleitung „Damit nach Europa.“ – **Europa** (ca. 8 %): 2 bis 4 Themen aus EU und den
   europäischen Ländern (inkl. Ukraine und Russland).
8. Überleitung „Und ein Blick in die Welt.“ – **Welt** (ca. 10 %): 3 bis 5 Themen außerhalb
   Europas, am Ende ggf. „Noch einige Meldungen in Kürze“.
   Jedes Thema nur in EINEM Teil erzählen (z. B. EU-Gipfel unter Europa, nicht unter Welt).
9. Überleitung „Und zum Schluss das Wetter in Nordrhein-Westfalen.“ – zusammenhängend
   formuliert, keine Liste von Orten: zuerst heute (Wetterlage, Temperaturspanne, Regen, Wind),
   dabei Schöppingen und das Münsterland nennen und auffällige Unterschiede im Land erwähnen
   (z. B. kühler im Sauerland, mehr Regen in Ostwestfalen). Dann kurz morgen. Auf Auffälliges
   hinweisen: Sturmböen ab etwa 60 km/h, Frost, Glätte, Gewitter, Starkregen. Temperaturen als
   ganze Zahlen („zwischen 7 und 14 Grad“), keine Millimeter- oder Prozentkolonnen vorlesen.
   Sind die Wetterdaten nicht erreichbar, den Wetterteil weglassen.
10. Kurzer Abschluss mit Datum und „bis morgen!“.

Regeln:
- Nur Fakten verwenden, die in `arbeit/lage.md` stehen. Nichts erfinden oder ausschmücken (keine
  erfundenen Zahlen, Verletztenangaben, Ergebnisse, Ursachen). Wenn nur ein Titel bekannt ist,
  nur das berichten, was der Titel hergibt. Unbestätigtes als Bericht kennzeichnen
  („laut Medienberichten“).
- Alles in eigenen Worten formulieren, keine Sätze aus den Quellen übernehmen.
- Fehltreffer aussortieren: andere Orte gleichen Namens (z. B. Gronau bei Bergisch Gladbach oder
  in Niedersachsen, Oldenburger Münsterland, Heek als Ortsteil anderswo), Meldungen, in denen
  Schöppingen nur am Rande vorkommt (z. B. Sportberichte über andere Vereine), Werbung,
  Öffnungszeiten-Listen, doppelte Meldungen.
- Fürs Vorlesen schreiben: Abkürzungen ausschreiben (B 70 → Bundesstraße 70, Mrd. → Milliarden),
  keine Klammern, keine Sonderzeichen wie „|“ oder „&“, kurze Sätze.
- Danach einmal gegenlesen: Ist jede Aussage durch `arbeit/lage.md` gedeckt?
  Wortzahl prüfen mit `wc -w arbeit/skript.txt`.

Schreibe außerdem `arbeit/beschreibung.txt`: eine Zeile mit den 3–4 wichtigsten Themen, durch
Kommas getrennt, Schöppingen zuerst (z. B. „Schöppingen: neues Ratsmitglied, Heek:
Adventuregolf-Pläne, NRW: Gen-Z-Demos, Ukraine-Gespräche“).

## Schritt 4 – Einreichen

```bash
bash veroeffentlichen.sh arbeit/skript.txt "$DATUM" arbeit/beschreibung.txt
```

Das legt den Sprechtext unter `skripte/` ab und pusht ihn nach `main`. Vertonen und Homepage
übernimmt danach automatisch GitHub Actions – NICHT selbst vertonen (`vertonen.mjs` funktioniert
in dieser Cloud-Umgebung nicht zuverlässig) und nicht darauf warten. Sonst nichts committen oder
pushen. Der Ordner `arbeit/` ist in `.gitignore` und bleibt lokal.

## Schritt 5 – Rückmeldung

Antworte am Ende in 2–4 Zeilen auf Deutsch: ob der Sprechtext eingereicht ist, Wortzahl,
die 3 Top-Themen. Bei Fehlern: was nicht geklappt hat (z. B. welcher Feed nicht erreichbar war).
