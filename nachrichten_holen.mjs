// Holt aktuelle Schlagzeilen aus RSS-Feeds und schreibt eine kompakte Übersicht
// (Titel, kurzer Anrisstext, Quelle, Uhrzeit) als Grundlage für das Podcast-Skript.
//
// Aufruf:  node nachrichten_holen.mjs <ausgabe.md> [Stunden=30]

import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const gn = (q) => `https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:2d")}&hl=de&gl=DE&ceid=DE:de`;

const FEEDS = [
  { rubrik: "Region", name: "Google News: Schöppingen", url: gn("Schöppingen"), max: 15 },
  { rubrik: "Region", name: "Google News: Kreis Borken", url: gn('"Kreis Borken" OR Ahaus OR Heek OR Gronau OR Stadtlohn'), max: 20 },
  { rubrik: "Region", name: "Polizei Borken", url: "https://www.presseportal.de/rss/dienststelle_24843.rss2", max: 10 },
  { rubrik: "Region", name: "Google News: Kreis Steinfurt", url: gn('"Kreis Steinfurt" OR Rheine OR Metelen OR Horstmar'), max: 15 },
  { rubrik: "Region", name: "Polizei Steinfurt", url: "https://www.presseportal.de/rss/dienststelle_43526.rss2", max: 8 },
  { rubrik: "Deutschland", name: "tagesschau Inland", url: "https://www.tagesschau.de/inland/index~rss2.xml", max: 20 },
  { rubrik: "Welt", name: "tagesschau Ausland", url: "https://www.tagesschau.de/ausland/index~rss2.xml", max: 20 },
  { rubrik: "Deutschland + Welt", name: "Deutschlandfunk Nachrichten", url: "https://www.deutschlandfunk.de/nachrichten-100.rss", max: 25 },
];

const [ausgabe, stundenArg] = process.argv.slice(2);
if (!ausgabe) {
  console.error("Aufruf: node nachrichten_holen.mjs <ausgabe.md> [Stunden]");
  process.exit(1);
}
const grenze = Date.now() - Number(stundenArg || 30) * 3600 * 1000;

const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
function bereinige(s = "") {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) =>
      e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
                   : entities[e] ?? m)
    .replace(/<[^>]+>/g, " ") // Entities können selbst HTML enthalten
    .replace(/\s+/g, " ")
    .trim();
}

const feld = (item, tag) => (item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)) || [])[1];

// Manche Seiten (z. B. tagesschau, Deutschlandfunk) lehnen Anfragen von Node.js aus
// Rechenzentren mit HTTP 403 ab, lassen curl aber durch – daher curl als Ausweichweg.
async function ladeText(url) {
  let grund;
  try {
    const antwort = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (antwort.ok) return await antwort.text();
    grund = `HTTP ${antwort.status}`;
  } catch (fehler) {
    grund = fehler.message;
  }
  try {
    const { stdout } = await execFileAsync(
      "curl", ["-sSfL", "--max-time", "20", "-A", "Mozilla/5.0", url],
      { maxBuffer: 20 * 1024 * 1024 });
    return stdout;
  } catch (fehler) {
    throw new Error(`${grund}; curl: ${fehler.stderr?.trim() || fehler.message}`);
  }
}

async function holeFeed({ name, url, max }) {
  const xml = await ladeText(url);
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/g) || [];
  return items
    .map((it) => {
      const datum = new Date(feld(it, "pubDate") || feld(it, "dc:date") || 0);
      let anriss = bereinige(feld(it, "description"));
      const titel = bereinige(feld(it, "title"));
      if (anriss.startsWith(titel.slice(0, 30))) anriss = ""; // Google News wiederholt nur den Titel
      return { titel, anriss: anriss.slice(0, 300), datum };
    })
    .filter((m) => m.titel && (isNaN(m.datum) || m.datum.getTime() >= grenze))
    .slice(0, max);
}

const normal = (t) => t.toLowerCase().replace(/ - [^-]+$/, "").replace(/[^a-zäöüß0-9]/g, "").slice(0, 60);
const gesehen = new Set();
const uhrzeit = (d) => (isNaN(d) ? "" : d.toLocaleString("de-DE", { weekday: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }));

let md = `# Nachrichtenlage, abgerufen ${new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}\n`;
for (const feed of FEEDS) {
  md += `\n## ${feed.rubrik} – ${feed.name}\n`;
  try {
    const meldungen = await holeFeed(feed);
    let n = 0;
    for (const m of meldungen) {
      const key = normal(m.titel);
      if (gesehen.has(key)) continue;
      gesehen.add(key);
      md += `- [${uhrzeit(m.datum)}] ${m.titel}${m.anriss ? ` — ${m.anriss}` : ""}\n`;
      n++;
    }
    if (!n) md += "- (keine neuen Meldungen)\n";
  } catch (fehler) {
    md += `- (Feed nicht erreichbar: ${fehler.message})\n`;
  }
}

// Wetter für NRW: Vorhersage heute und morgen für einige Orte (Open-Meteo, ohne Schlüssel)
const ORTE = [
  ["Schöppingen", 52.10, 7.23], ["Münster", 51.96, 7.63], ["Bielefeld", 52.02, 8.53],
  ["Dortmund", 51.51, 7.47], ["Düsseldorf", 51.23, 6.78], ["Köln", 50.94, 6.96],
  ["Winterberg (Sauerland)", 51.19, 8.53],
];
const WETTERLAGE = {
  0: "klar", 1: "überwiegend klar", 2: "teils bewölkt", 3: "bedeckt", 45: "Nebel", 48: "Nebel mit Reif",
  51: "leichter Nieselregen", 53: "Nieselregen", 55: "starker Nieselregen", 56: "gefrierender Nieselregen",
  57: "starker gefrierender Nieselregen", 61: "leichter Regen", 63: "Regen", 65: "starker Regen",
  66: "gefrierender Regen", 67: "starker gefrierender Regen", 71: "leichter Schneefall", 73: "Schneefall",
  75: "starker Schneefall", 77: "Schneegriesel", 80: "leichte Regenschauer", 81: "Regenschauer",
  82: "heftige Regenschauer", 85: "Schneeschauer", 86: "starke Schneeschauer", 95: "Gewitter",
  96: "Gewitter mit Hagel", 99: "schweres Gewitter mit Hagel",
};

md += "\n## Wetter NRW – Vorhersage (Open-Meteo)\n";
try {
  const felder = "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max," +
    "precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,sunshine_duration";
  const url = "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${ORTE.map((o) => o[1]).join(",")}&longitude=${ORTE.map((o) => o[2]).join(",")}` +
    `&daily=${felder}&timezone=Europe%2FBerlin&forecast_days=2`;
  const daten = JSON.parse(await ladeText(url));
  ORTE.forEach(([name], i) => {
    const d = daten[i].daily;
    const tage = d.time.map((tag, t) =>
      `${t === 0 ? "heute" : "morgen"}: ${WETTERLAGE[d.weather_code[t]] ?? `Code ${d.weather_code[t]}`}, ` +
      `${Math.round(d.temperature_2m_min[t])} bis ${Math.round(d.temperature_2m_max[t])} Grad, ` +
      `Regenrisiko ${d.precipitation_probability_max[t]} % (${d.precipitation_sum[t]} mm), ` +
      `Wind bis ${Math.round(d.wind_speed_10m_max[t])} km/h, Böen bis ${Math.round(d.wind_gusts_10m_max[t])} km/h, ` +
      `Sonne ${(d.sunshine_duration[t] / 3600).toFixed(1)} h`);
    md += `- ${name} — ${tage.join(" | ")}\n`;
  });
} catch (fehler) {
  md += `- (Wetterdaten nicht erreichbar: ${fehler.message})\n`;
}

await mkdir(dirname(ausgabe), { recursive: true });
await writeFile(ausgabe, md, "utf8");
console.log(`Gespeichert: ${ausgabe} (${md.length} Zeichen)`);
