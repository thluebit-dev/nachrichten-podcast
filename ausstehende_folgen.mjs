// Gibt die Daten (JJJJ-MM-TT, aufsteigend) aller Sprechtexte unter skripte/ aus, die noch
// vertont werden müssen: aus den letzten 14 Tagen und ohne Folge auf der Homepage – oder
// neuer als die vorhandene Folge (Text wurde neu eingereicht).
//
// Aufruf:  node ausstehende_folgen.mjs [folgen.json]

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const TAGE = 14;
const [listePfad] = process.argv.slice(2);

const folgen = listePfad && existsSync(listePfad) ? JSON.parse(await readFile(listePfad, "utf8")) : [];
const erstellt = new Map(folgen.map((f) => [f.datum, new Date(f.erstellt)]));
const grenze = new Date(Date.now() - TAGE * 86400 * 1000).toISOString().slice(0, 10);

const daten = (await readdir("skripte"))
  .map((d) => d.match(/^(\d{4}-\d{2}-\d{2})\.txt$/)?.[1])
  .filter((d) => d && d >= grenze)
  .sort();

for (const datum of daten) {
  const eingereicht = new Date(execFileSync("git", ["log", "-1", "--format=%cI", "--", `skripte/${datum}.txt`]).toString().trim());
  if (!erstellt.has(datum) || eingereicht > erstellt.get(datum)) console.log(datum);
}
