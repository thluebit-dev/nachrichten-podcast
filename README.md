# Nachrichten-Podcast

Privater, täglicher Nachrichten-Podcast (ca. 10 Minuten): Schöppingen, Kreis Borken,
Kreis Steinfurt, Deutschland, die Welt und das Wetter in NRW.

- Homepage: https://thluebit-dev.github.io/nachrichten-podcast/
- Podcast-Feed: https://thluebit-dev.github.io/nachrichten-podcast/feed.xml

## Ablauf

1. **Claude-Cloud-Routine** (täglich morgens) arbeitet [ANLEITUNG.md](ANLEITUNG.md) ab: Schlagzeilen
   und Wetter holen, Sprechtext schreiben und gegenlesen, Text unter `skripte/` nach `main` pushen.
2. **GitHub Actions** ([folge.yml](.github/workflows/folge.yml)) bemerkt den neuen Text, vertont
   ihn und aktualisiert die Homepage (Zweig `gh-pages`, behält die letzten 14 Folgen). Dabei
   werden auch ältere, noch nicht vertonte Texte der letzten 14 Tage nachgeholt.
   Von Hand neu starten: Actions → „Folge vertonen und veröffentlichen“ → „Run workflow“.

| Datei | Zweck |
|---|---|
| `nachrichten_holen.mjs` | Schlagzeilen aus RSS-Feeds und Wetter für NRW (Open-Meteo) holen |
| `veroeffentlichen.sh` | Sprechtext unter `skripte/` ablegen und pushen (Cloud-Routine) |
| `ausstehende_folgen.mjs` | Sprechtexte der letzten 14 Tage finden, die noch vertont werden müssen |
| `vertonen.mjs` | Sprechtext mit Microsoft-Neural-Stimme als MP3 vertonen (GitHub Actions) |
| `seite_bauen.mjs` | Startseite und Podcast-Feed bauen |
| `seite_aktualisieren.sh` | Homepage in den Zweig `gh-pages` schreiben (GitHub Actions) |

Die Sprechtexte sind eigene Zusammenfassungen; die Quellen sind tagesschau, Deutschlandfunk,
Google News (regionale Medien), die Pressemeldungen der Polizei Borken und Steinfurt sowie
Open-Meteo für das Wetter.
