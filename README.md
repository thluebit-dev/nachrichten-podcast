# Nachrichten-Podcast

Privater, täglicher Nachrichten-Podcast (ca. 10 Minuten): Schöppingen, Kreis Borken,
Kreis Steinfurt, Deutschland und die Welt. Eine Claude-Cloud-Routine erstellt jeden Morgen
eine Folge nach [ANLEITUNG.md](ANLEITUNG.md) und veröffentlicht sie auf GitHub Pages.

- Homepage: https://thluebit-dev.github.io/nachrichten-podcast/
- Podcast-Feed: https://thluebit-dev.github.io/nachrichten-podcast/feed.xml

| Datei | Zweck |
|---|---|
| `nachrichten_holen.mjs` | Schlagzeilen aus RSS-Feeds und Wetter für NRW (Open-Meteo) holen |
| `vertonen.mjs` | Sprechtext mit Microsoft-Neural-Stimme als MP3 vertonen |
| `seite_bauen.mjs` | Startseite und Podcast-Feed bauen (behält die letzten 14 Folgen) |
| `veroeffentlichen.sh` | Homepage in den Zweig `gh-pages` schreiben |

Die Sprechtexte sind eigene Zusammenfassungen; die Quellen sind tagesschau, Deutschlandfunk,
Google News (regionale Medien) und die Pressemeldungen der Polizei Borken und Steinfurt.
