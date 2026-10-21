// Vertont einen Sprechtext (UTF-8-Textdatei) als MP3 mit einer Microsoft-Neural-Stimme
// und kopiert die Folge (nur auf dem Windows-PC) in den Google-Drive-Ordner.
//
// Aufruf:  node vertonen.mjs <skript.txt> <ziel.mp3> [Stimme]
// Beispiel: node vertonen.mjs skripte/2026-10-21.txt folgen/2026-10-21.mp3

import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, basename } from "node:path";

const DRIVE_ORDNER = "G:\\Meine Ablage\\Podcast";
const MAX_ZEICHEN = 2500; // pro Anfrage an den Sprachdienst

const [skriptPfad, zielPfad, stimme = "de-DE-SeraphinaMultilingualNeural"] = process.argv.slice(2);
if (!skriptPfad || !zielPfad) {
  console.error("Aufruf: node vertonen.mjs <skript.txt> <ziel.mp3> [Stimme]");
  process.exit(1);
}

const escapeXml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

// Absätze zu Abschnitten bis MAX_ZEICHEN zusammenfassen
function abschnitte(text) {
  const absaetze = text.split(/\n\s*\n/).map((a) => a.replace(/\s+/g, " ").trim()).filter(Boolean);
  const teile = [];
  let aktuell = "";
  for (const absatz of absaetze) {
    if (aktuell && (aktuell.length + absatz.length + 2) > MAX_ZEICHEN) {
      teile.push(aktuell);
      aktuell = "";
    }
    aktuell = aktuell ? `${aktuell}\n\n${absatz}` : absatz;
  }
  if (aktuell) teile.push(aktuell);
  return teile;
}

function vertone(tts, text) {
  return new Promise((resolve, reject) => {
    const puffer = [];
    const { audioStream } = tts.toStream(escapeXml(text));
    audioStream.on("data", (d) => puffer.push(d));
    audioStream.on("error", reject);
    audioStream.on("close", () => resolve(Buffer.concat(puffer)));
  });
}

const text = await readFile(skriptPfad, "utf8");
const teile = abschnitte(text);

const tts = new MsEdgeTTS();
await tts.setMetadata(stimme, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

const audio = [];
for (const [i, teil] of teile.entries()) {
  let versuch = 0;
  while (true) {
    try {
      audio.push(await vertone(tts, teil));
      break;
    } catch (fehler) {
      if (++versuch >= 3) throw fehler;
      console.warn(`Abschnitt ${i + 1}: Fehler, neuer Versuch …`);
    }
  }
  console.log(`Abschnitt ${i + 1}/${teile.length} vertont`);
}
tts.close();

const mp3 = Buffer.concat(audio);
await mkdir(dirname(zielPfad), { recursive: true });
await writeFile(zielPfad, mp3);
console.log(`Gespeichert: ${zielPfad} (${(mp3.length / 1024 / 1024).toFixed(1)} MB, ca. ${Math.round(mp3.length / 6000 / 60)} min)`);

// Nur auf dem eigenen Windows-PC mit Google Drive für Desktop – in der Cloud entfällt das.
if (process.env.OHNE_DRIVE || process.platform !== "win32" || !existsSync("G:\\Meine Ablage")) process.exit(0);
await mkdir(DRIVE_ORDNER, { recursive: true });
await copyFile(zielPfad, `${DRIVE_ORDNER}\\${basename(zielPfad)}`);
console.log(`In Google Drive kopiert: ${DRIVE_ORDNER}\\${basename(zielPfad)}`);
