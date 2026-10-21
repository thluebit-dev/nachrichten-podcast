// Fügt eine neue Folge in den Homepage-Ordner ein, behält nur die neuesten Folgen
// und schreibt Startseite (index.html) und Podcast-Feed (feed.xml) neu.
//
// Aufruf:  node seite_bauen.mjs <seitenordner> <folge.mp3> <JJJJ-MM-TT> <beschreibung.txt>

import { readFile, writeFile, mkdir, copyFile, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename } from "node:path";

const BASIS_URL = "https://thluebit-dev.github.io/nachrichten-podcast/";
const TITEL = "Guten Morgen, Münsterland";
const UNTERTITEL = "Täglich ca. 10 Minuten: Schöppingen, Kreis Borken, Kreis Steinfurt, Deutschland und die Welt";
const ANZAHL_BEHALTEN = 14;
const BYTES_PRO_SEKUNDE = 6000; // 48 kbit/s MP3

const [seite, mp3, datum, beschreibungPfad] = process.argv.slice(2);
if (!seite || !mp3 || !/^\d{4}-\d{2}-\d{2}$/.test(datum || "")) {
  console.error("Aufruf: node seite_bauen.mjs <seitenordner> <folge.mp3> <JJJJ-MM-TT> [beschreibung.txt]");
  process.exit(1);
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const datumLang = (d) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Berlin" });
const dauer = (bytes) => {
  const s = Math.round(bytes / BYTES_PRO_SEKUNDE);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// Neue Folge übernehmen
await mkdir(join(seite, "folgen"), { recursive: true });
const datei = `${datum}.mp3`;
await copyFile(mp3, join(seite, "folgen", datei));
const bytes = (await stat(mp3)).size;
const beschreibung = beschreibungPfad && existsSync(beschreibungPfad)
  ? (await readFile(beschreibungPfad, "utf8")).trim()
  : "";

const listePfad = join(seite, "folgen.json");
let folgen = existsSync(listePfad) ? JSON.parse(await readFile(listePfad, "utf8")) : [];
folgen = folgen.filter((f) => f.datum !== datum);
folgen.push({ datum, datei, bytes, beschreibung, erstellt: new Date().toISOString() });
folgen.sort((a, b) => b.datum.localeCompare(a.datum));

// Alte Folgen entfernen
for (const alt of folgen.slice(ANZAHL_BEHALTEN)) {
  await rm(join(seite, "folgen", alt.datei), { force: true });
}
folgen = folgen.slice(0, ANZAHL_BEHALTEN);
await writeFile(listePfad, JSON.stringify(folgen, null, 2) + "\n");

// Podcast-Feed
const items = folgen.map((f) => `    <item>
      <title>${esc(`Nachrichten vom ${datumLang(f.datum)}`)}</title>
      <description>${esc(f.beschreibung || "Ihr täglicher Nachrichtenüberblick.")}</description>
      <enclosure url="${BASIS_URL}folgen/${f.datei}" length="${f.bytes}" type="audio/mpeg"/>
      <guid isPermaLink="false">nachrichten-${f.datum}</guid>
      <pubDate>${new Date(f.erstellt).toUTCString()}</pubDate>
      <itunes:duration>${dauer(f.bytes)}</itunes:duration>
    </item>`).join("\n");

await writeFile(join(seite, "feed.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(TITEL)}</title>
    <link>${BASIS_URL}</link>
    <atom:link href="${BASIS_URL}feed.xml" rel="self" type="application/rss+xml"/>
    <description>${esc(UNTERTITEL)}</description>
    <language>de-de</language>
    <itunes:author>Privater Nachrichten-Podcast</itunes:author>
    <itunes:explicit>false</itunes:explicit>
    <itunes:block>Yes</itunes:block>
    <itunes:category text="News"/>
${items}
  </channel>
</rss>
`);

// Startseite
const eintraege = folgen.map((f, i) => `      <article class="folge${i === 0 ? " neu" : ""}">
        <h2>${esc(datumLang(f.datum))}</h2>
        <p class="meta">${dauer(f.bytes)} min</p>
        ${f.beschreibung ? `<p>${esc(f.beschreibung)}</p>` : ""}
        <audio controls preload="${i === 0 ? "metadata" : "none"}" src="folgen/${f.datei}"></audio>
      </article>`).join("\n");

await writeFile(join(seite, "index.html"), `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${esc(TITEL)}</title>
  <link rel="alternate" type="application/rss+xml" title="${esc(TITEL)}" href="feed.xml">
  <style>
    :root { --bg: #f6f4ef; --karte: #ffffff; --text: #1f2328; --leise: #5f6670; --akzent: #2f6f4e; --rand: #e3dfd6; }
    @media (prefers-color-scheme: dark) {
      :root { --bg: #15181c; --karte: #1e2227; --text: #e8e6e1; --leise: #9aa1a9; --akzent: #7cc39b; --rand: #2c3138; }
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--text); font: 17px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif; }
    main { max-width: 680px; margin: 0 auto; padding: 32px 16px 64px; }
    header h1 { margin: 0 0 4px; font-size: 1.7rem; }
    header p { margin: 0 0 24px; color: var(--leise); }
    .folge { background: var(--karte); border: 1px solid var(--rand); border-radius: 14px; padding: 16px 18px; margin-bottom: 14px; }
    .folge.neu { border-color: var(--akzent); }
    .folge h2 { margin: 0; font-size: 1.1rem; }
    .meta { margin: 2px 0 8px; color: var(--leise); font-size: .9rem; }
    .folge p { margin: 0 0 10px; }
    audio { width: 100%; }
    details { margin-top: 28px; color: var(--leise); }
    details summary { cursor: pointer; color: var(--text); }
    code { background: var(--karte); border: 1px solid var(--rand); border-radius: 6px; padding: 2px 6px; word-break: break-all; }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>${esc(TITEL)}</h1>
      <p>${esc(UNTERTITEL)}</p>
    </header>
${eintraege}
    <details>
      <summary>In einer Podcast-App abonnieren</summary>
      <p>In der Podcast-App „Podcast per URL hinzufügen“ wählen und diese Adresse einfügen:</p>
      <p><code>${BASIS_URL}feed.xml</code></p>
    </details>
  </main>
</body>
</html>
`);

await writeFile(join(seite, "robots.txt"), "User-agent: *\nDisallow: /\n");
await writeFile(join(seite, ".nojekyll"), "");
console.log(`Seite gebaut: ${folgen.length} Folge(n), neueste ${datum} (${dauer(bytes)} min)`);
