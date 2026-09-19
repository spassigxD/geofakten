/**
 * Regenerates the bundled world map data.
 *
 *   node scripts/build-world-data.mjs
 *
 * Sources (all free / no API key):
 *   - Natural Earth 1:50m Admin 0 countries (public domain) for the geometry,
 *     German names, ISO codes and Wikidata ids.
 *   - Wikidata (CC0) for the German Wikipedia article title and the offline
 *     fallback facts that are shown when the live lookup fails.
 *
 * Network access is only needed when regenerating; the committed output is
 * everything the app needs at runtime.
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { geoArea } from "d3-geo";
import { topology } from "topojson-server";
import { presimplify, quantile, simplify } from "topojson-simplify";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = path.join(ROOT, ".cache");
const SOURCE_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson";
const SOURCE_FILE = path.join(CACHE_DIR, "ne_50m_admin_0_countries.geojson");
const TOPO_OUT = path.join(ROOT, "public", "data", "world-countries.topo.json");
const META_OUT = path.join(ROOT, "src", "data", "world-countries.meta.json");
const USER_AGENT =
  "Geofakten/1.0 (https://github.com/spassigxD/geofakten; build script) node-fetch";

const EARTH_RADIUS_KM = 6371.0088;

/** Entities that exist on the map but are not (fully recognised) states. */
const PARTIALLY_RECOGNISED = new Set([
  "CYN",
  "KOS",
  "PSX",
  "SAH",
  "SOL",
  "TWN",
]);
/** Land masses without a population that should not read as countries. */
const REGIONS = new Set(["ATA", "KAS", "ATC", "IOA", "HMD", "SGS"]);

const CONTINENTS = {
  Africa: "africa",
  Asia: "asia",
  Europe: "europe",
  "North America": "north-america",
  Oceania: "oceania",
  "South America": "south-america",
};

async function ensureSource() {
  await mkdir(CACHE_DIR, { recursive: true });
  if (existsSync(SOURCE_FILE)) return SOURCE_FILE;
  process.stdout.write(`Lade ${SOURCE_URL}\n`);
  const response = await fetch(SOURCE_URL, {
    headers: { "user-agent": USER_AGENT },
  });
  if (!response.ok) {
    throw new Error(`Natural Earth download failed: ${response.status}`);
  }
  await writeFile(SOURCE_FILE, Buffer.from(await response.arrayBuffer()));
  return SOURCE_FILE;
}

function classify(properties) {
  const a3 = properties.ADM0_A3;
  if (REGIONS.has(a3)) return "region";
  if (PARTIALLY_RECOGNISED.has(a3)) return "disputed";
  if (properties.SOVEREIGNT !== properties.ADMIN) return "dependency";
  return "country";
}

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function fetchJson(url, init) {
  const response = await fetch(url, {
    ...init,
    headers: { "user-agent": USER_AGENT, ...(init?.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

/** German Wikipedia article title per Wikidata item. */
async function fetchArticleTitles(qids) {
  const titles = new Map();
  for (const batch of chunk(qids, 50)) {
    const url =
      "https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&formatversion=2" +
      `&props=sitelinks&sitefilter=dewiki&ids=${batch.join("%7C")}`;
    const data = await fetchJson(url);
    for (const [qid, entity] of Object.entries(data.entities ?? {})) {
      const title = entity?.sitelinks?.dewiki?.title;
      if (title) titles.set(qid, title);
    }
  }
  return titles;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** The public query service throttles aggressively, so back off and retry. */
async function sparql(query, attempt = 1) {
  const response = await fetch("https://query.wikidata.org/sparql", {
    method: "POST",
    headers: {
      accept: "application/sparql-results+json",
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": USER_AGENT,
    },
    body: new URLSearchParams({ query }).toString(),
  });
  if (!response.ok) {
    if (attempt >= 5) throw new Error(`SPARQL ${response.status}`);
    await sleep(2000 * 2 ** attempt);
    return sparql(query, attempt + 1);
  }
  const data = await response.json();
  await sleep(1500);
  return data.results.bindings;
}

/**
 * One query per property: combining them into a single query multiplies the
 * intermediate result set and silently drops values for a few items.
 */
const FALLBACK_QUERIES = [
  {
    key: "capital",
    labelled: "P36",
  },
  {
    key: "languages",
    labelled: "P37",
    join: true,
  },
  { key: "currency", labelled: "P38" },
  { key: "government", labelled: "P122" },
];

async function fetchFallbackFacts(qids) {
  const values = qids.map((qid) => `wd:${qid}`).join(" ");
  const facts = new Map(qids.map((qid) => [qid, {}]));
  const set = (qid, key, value) => {
    if (value === undefined) return;
    const entry = facts.get(qid);
    if (entry) entry[key] = value;
  };
  const toQid = (row) =>
    row.item.value.replace("http://www.wikidata.org/entity/", "");

  const run = async (label, query, apply) => {
    try {
      const rows = await sparql(query);
      for (const row of rows) apply(toQid(row), row);
      process.stdout.write(`  ${label}: ${rows.length}\n`);
    } catch (error) {
      process.stdout.write(`  WARN ${label} fehlgeschlagen: ${error}\n`);
    }
  };

  for (const { key, labelled, join } of FALLBACK_QUERIES) {
    const aggregate = join
      ? `(GROUP_CONCAT(DISTINCT ?label; separator=", ") AS ?value)`
      : `(SAMPLE(?label) AS ?value)`;
    await run(
      key,
      `
SELECT ?item ${aggregate} WHERE {
  VALUES ?item { ${values} }
  ?item wdt:${labelled} ?target .
  ?target rdfs:label ?label . FILTER(lang(?label) = "de")
}
GROUP BY ?item`,
      (qid, row) => set(qid, key, row.value?.value?.trim())
    );
  }

  await run(
    "population",
    `
SELECT ?item (SAMPLE(?populationValue) AS ?population) WHERE {
  VALUES ?item { ${values} }
  ?item wdt:P1082 ?populationValue .
}
GROUP BY ?item`,
    (qid, row) => set(qid, "population", Number(row.population.value))
  );

  await run(
    "area",
    `
SELECT ?item (SAMPLE(?squareMetres) AS ?area) WHERE {
  VALUES ?item { ${values} }
  ?item p:P2046/psn:P2046/wikibase:quantityAmount ?squareMetres .
}
GROUP BY ?item`,
    (qid, row) => set(qid, "areaKm2", Number(row.area.value) / 1e6)
  );

  await run(
    "officialName",
    `
SELECT ?item (SAMPLE(?name) AS ?officialName) WHERE {
  VALUES ?item { ${values} }
  ?item wdt:P1448 ?name . FILTER(lang(?name) = "de")
}
GROUP BY ?item`,
    (qid, row) => set(qid, "officialName", row.officialName.value.trim())
  );

  return facts;
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/** Micro-states would round to 0 km², so keep decimals for small areas. */
function roundArea(value) {
  if (value >= 1000) return Math.round(value);
  if (value >= 10) return round(value, 1);
  return round(value, 2);
}

async function main() {
  const source = await ensureSource();
  const collection = JSON.parse(await readFile(source, "utf8"));

  const features = collection.features
    .map((feature) => {
      const p = feature.properties;
      const id = p.ADM0_A3;
      const iso3 = p.ISO_A3 && p.ISO_A3 !== "-99" ? p.ISO_A3 : undefined;
      const iso2 = p.ISO_A2 && p.ISO_A2 !== "-99" ? p.ISO_A2 : undefined;
      return {
        type: "Feature",
        id,
        properties: {
          id,
          name: p.NAME_DE || p.NAME,
          kind: classify(p),
          continent: CONTINENTS[p.CONTINENT] ?? null,
        },
        geometry: feature.geometry,
        meta: {
          id,
          name: p.NAME_DE || p.NAME,
          nameEn: p.NAME_EN || p.NAME,
          iso2,
          iso3,
          qid: p.WIKIDATAID && p.WIKIDATAID !== "-99" ? p.WIKIDATAID : undefined,
          kind: classify(p),
          continent: CONTINENTS[p.CONTINENT] ?? null,
          sovereign: p.SOVEREIGNT !== p.ADMIN ? p.SOVEREIGNT : undefined,
          lon: round(p.LABEL_X, 3),
          lat: round(p.LABEL_Y, 3),
          geoAreaKm2: Math.round(geoArea(feature) * EARTH_RADIUS_KM ** 2),
          popEst: p.POP_EST > 0 ? Math.round(p.POP_EST) : undefined,
        },
      };
    })
    .sort((a, b) => a.properties.name.localeCompare(b.properties.name, "de"));

  const qids = features.map((f) => f.meta.qid).filter(Boolean);

  let titles = new Map();
  try {
    titles = await fetchArticleTitles(qids);
    process.stdout.write(`Wikipedia-Titel: ${titles.size}/${qids.length}\n`);
  } catch (error) {
    process.stdout.write(`WARN Wikipedia-Titel fehlgeschlagen: ${error}\n`);
  }

  const fallback = await fetchFallbackFacts(qids);

  const meta = features.map((feature) => {
    const base = feature.meta;
    const facts = (base.qid && fallback.get(base.qid)) || {};
    const population = facts.population ?? base.popEst;
    const areaKm2 = facts.areaKm2 ?? base.geoAreaKm2;
    return {
      id: base.id,
      name: base.name,
      nameEn: base.nameEn,
      officialName: facts.officialName,
      iso2: base.iso2,
      iso3: base.iso3,
      qid: base.qid,
      title: (base.qid && titles.get(base.qid)) || base.name,
      kind: base.kind,
      continent: base.continent,
      sovereign: base.sovereign,
      lon: base.lon,
      lat: base.lat,
      capital: facts.capital,
      languages: facts.languages,
      currency: facts.currency,
      government: facts.government,
      population: population ? Math.round(population) : undefined,
      areaKm2: areaKm2 ? roundArea(areaKm2) : undefined,
    };
  });

  const geo = {
    type: "FeatureCollection",
    features: features.map(({ type, id, properties, geometry }) => ({
      type,
      id,
      properties,
      geometry,
    })),
  };

  let topo = topology({ countries: geo }, 1e5);
  topo = presimplify(topo);
  const minWeight = quantile(topo, 0.12);
  topo = simplify(topo, minWeight);
  topo.attribution = "Natural Earth (public domain), 1:50m Admin 0 countries";

  await mkdir(path.dirname(TOPO_OUT), { recursive: true });
  const topoJson = JSON.stringify(topo);
  await writeFile(TOPO_OUT, topoJson);
  await writeFile(META_OUT, `${JSON.stringify(meta, null, 2)}\n`);

  const kinds = meta.reduce((acc, item) => {
    acc[item.kind] = (acc[item.kind] ?? 0) + 1;
    return acc;
  }, {});
  process.stdout.write(
    [
      `Flächen: ${meta.length} (${JSON.stringify(kinds)})`,
      `TopoJSON: ${(topoJson.length / 1024).toFixed(0)} kB`,
      `Hash: ${createHash("sha1").update(topoJson).digest("hex").slice(0, 12)}`,
      `Ohne Hauptstadt: ${meta.filter((m) => !m.capital).length}`,
      "",
    ].join("\n")
  );
}

main().catch((error) => {
  process.stderr.write(`${error?.stack ?? error}\n`);
  process.exit(1);
});
