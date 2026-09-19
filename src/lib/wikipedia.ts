import { continentLabels } from "@/lib/geo";
import type { Fact } from "@/lib/types";
import {
  type CountryMeta,
  formatArea,
  formatNumber,
  kindLabels,
} from "@/lib/world";

/**
 * Live country facts, assembled in the browser from the German Wikipedia REST
 * summary and Wikidata statements. Both APIs are CORS-enabled and need no key,
 * which keeps the app deployable as a static site.
 */
export interface CountryDossier {
  id: string;
  name: string;
  officialName?: string;
  description?: string;
  summary?: string;
  articleUrl: string;
  imageUrl?: string;
  flagUrl?: string;
  facts: Fact[];
  /** "wikipedia" = at least one live value, "offline" = bundled data only. */
  source: "wikipedia" | "offline";
  /** True when parts of the lookup failed and bundled data filled the gaps. */
  partial: boolean;
  fetchedAt: number;
}

const WIKIPEDIA_SUMMARY =
  "https://de.wikipedia.org/api/rest_v1/page/summary/";
const WIKIDATA_STATEMENTS =
  "https://www.wikidata.org/w/rest.php/wikibase/v1/entities/items/";
const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const COMMONS_FILE = "https://commons.wikimedia.org/wiki/Special:FilePath/";

const TIMEOUT_MS = 9000;
const CACHE_KEY = "geofakten.world.v1";
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const CACHE_LIMIT = 80;

const PROPERTIES = {
  capital: "P36",
  population: "P1082",
  area: "P2046",
  languages: "P37",
  currency: "P38",
  government: "P122",
  headOfState: "P35",
  headOfGovernment: "P6",
  flag: "P41",
} as const;

type PropertyKey = keyof typeof PROPERTIES;

/** Area units that appear on country items, converted to km². */
const AREA_UNITS: Record<string, number> = {
  Q712226: 1,
  Q25343: 1e-6,
  Q35852: 0.01,
  Q232291: 2.589988,
};

type StatementValue = {
  type: "value" | "somevalue" | "novalue";
  content?: unknown;
};

type Statement = {
  rank: "preferred" | "normal" | "deprecated";
  property: { id: string; data_type: string };
  value: StatementValue;
  qualifiers?: { property: { id: string }; value: StatementValue }[];
};

type StatementMap = Record<string, Statement[]>;

async function getJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function qualifier(statement: Statement, property: string) {
  return statement.qualifiers?.find((item) => item.property.id === property);
}

function timeValue(value: StatementValue | undefined): string | null {
  const time = (value?.content as { time?: string } | undefined)?.time;
  return typeof time === "string" ? time : null;
}

/** Drops deprecated and historic statements and honours the preferred rank. */
function currentStatements(statements: Statement[] | undefined): Statement[] {
  if (!statements?.length) return [];
  const usable = statements.filter(
    (statement) =>
      statement.value.type === "value" && statement.rank !== "deprecated"
  );
  const ongoing = usable.filter((statement) => !qualifier(statement, "P582"));
  const pool = ongoing.length ? ongoing : usable;
  const preferred = pool.filter((statement) => statement.rank === "preferred");
  return preferred.length ? preferred : pool;
}

function itemIds(statements: Statement[]): string[] {
  return statements
    .map((statement) => statement.value.content)
    .filter((content): content is string => typeof content === "string");
}

/** Population is stored as one statement per census year. */
function latestQuantity(
  statements: Statement[]
): { amount: number; year?: string } | null {
  let best: { amount: number; time: string | null } | null = null;
  for (const statement of statements) {
    const content = statement.value.content as
      | { amount?: string; unit?: string }
      | undefined;
    const amount = Number(content?.amount);
    if (!Number.isFinite(amount)) continue;
    const time = timeValue(qualifier(statement, "P585")?.value);
    if (!best || (time ?? "") > (best.time ?? "")) best = { amount, time };
  }
  if (!best) return null;
  const year = best.time?.slice(1, 5);
  return { amount: best.amount, year: year && year !== "0000" ? year : undefined };
}

function quantityInKm2(statements: Statement[]): number | null {
  for (const statement of statements) {
    const content = statement.value.content as
      | { amount?: string; unit?: string }
      | undefined;
    const amount = Number(content?.amount);
    if (!Number.isFinite(amount)) continue;
    const unitId = content?.unit?.split("/").pop() ?? "";
    const factor = AREA_UNITS[unitId];
    if (factor) return amount * factor;
  }
  return null;
}

const labelCache = new Map<string, string>();

async function resolveLabels(ids: string[]): Promise<Map<string, string>> {
  const missing = [...new Set(ids)].filter((id) => !labelCache.has(id));
  for (const batch of chunk(missing, 50)) {
    const url =
      `${WIKIDATA_API}?action=wbgetentities&format=json&formatversion=2` +
      `&origin=*&props=labels&languages=de%7Cen&languagefallback=1` +
      `&ids=${batch.join("%7C")}`;
    try {
      const data = await getJson<{
        entities?: Record<
          string,
          { labels?: Record<string, { value?: string }> }
        >;
      }>(url);
      for (const [id, entity] of Object.entries(data.entities ?? {})) {
        const label = entity.labels?.de?.value ?? entity.labels?.en?.value;
        if (label) labelCache.set(id, label);
      }
    } catch {
      // Labels are optional; the bundled fallback covers the gap.
    }
  }
  const result = new Map<string, string>();
  for (const id of ids) {
    const label = labelCache.get(id);
    if (label) result.set(id, label);
  }
  return result;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

type Summary = {
  type?: string;
  description?: string;
  extract?: string;
  thumbnail?: { source?: string };
  content_urls?: { desktop?: { page?: string } };
};

function articleUrl(title: string): string {
  return `https://de.wikipedia.org/wiki/${encodeURIComponent(
    title.replace(/ /g, "_")
  )}`;
}

async function fetchSummary(title: string): Promise<Summary | null> {
  try {
    return await getJson<Summary>(
      WIKIPEDIA_SUMMARY + encodeURIComponent(title.replace(/ /g, "_"))
    );
  } catch {
    return null;
  }
}

async function fetchStatements(
  qid: string
): Promise<Statements> {
  const entries = await Promise.all(
    (Object.entries(PROPERTIES) as [PropertyKey, string][]).map(
      async ([key, property]) => {
        try {
          const data = await getJson<StatementMap>(
            `${WIKIDATA_STATEMENTS}${qid}/statements?property=${property}`
          );
          return [key, currentStatements(data[property])] as const;
        } catch {
          return [key, null] as const;
        }
      }
    )
  );
  const result: Statements = {};
  for (const [key, statements] of entries) {
    if (statements) result[key] = statements;
  }
  return result;
}

function fact(
  label: string,
  value: string | undefined,
  category: Fact["category"]
): Fact | null {
  const trimmed = value?.trim();
  return trimmed ? { label, value: trimmed, category } : null;
}

function locationValue(meta: CountryMeta): string | undefined {
  const parts: string[] = [];
  if (meta.continent) parts.push(continentLabels[meta.continent]);
  if (meta.sovereign) parts.push(`Außengebiet von ${meta.sovereign}`);
  else if (meta.kind !== "country") parts.push(kindLabels[meta.kind]);
  return parts.length ? parts.join(" · ") : undefined;
}

/** Bundled Natural Earth + Wikidata snapshot, used whenever the live call fails. */
export function offlineDossier(meta: CountryMeta): CountryDossier {
  const facts = [
    fact("Lage", locationValue(meta), "lage"),
    fact("Hauptstadt", meta.capital, "hauptstadt"),
    meta.population
      ? fact("Einwohnerzahl", formatNumber(meta.population), "bevoelkerung")
      : null,
    meta.areaKm2 ? fact("Fläche", formatArea(meta.areaKm2), "flaeche") : null,
    fact("Amtssprache", meta.languages, "sprache"),
    fact("Staatsform", meta.government, "regierung"),
    fact("Währung", meta.currency, "waehrung"),
  ].filter((item): item is Fact => item !== null);

  return {
    id: meta.id,
    name: meta.name,
    officialName: meta.officialName,
    articleUrl: articleUrl(meta.title),
    facts,
    source: "offline",
    partial: true,
    fetchedAt: Date.now(),
  };
}

type Statements = Partial<Record<PropertyKey, Statement[]>>;

async function buildDossier(meta: CountryMeta): Promise<CountryDossier> {
  const [summary, statements] = await Promise.all<
    [Promise<Summary | null>, Promise<Statements>]
  >([
    fetchSummary(meta.title),
    meta.qid ? fetchStatements(meta.qid) : Promise.resolve<Statements>({}),
  ]);

  const referenced = [
    ...itemIds(statements.capital ?? []),
    ...itemIds(statements.languages ?? []),
    ...itemIds(statements.currency ?? []),
    ...itemIds(statements.government ?? []),
    ...itemIds(statements.headOfState ?? []),
    ...itemIds(statements.headOfGovernment ?? []),
  ];
  const labels = await resolveLabels(referenced);

  const labelList = (statements: Statement[] | undefined, max: number) => {
    const values = itemIds(statements ?? [])
      .map((id) => labels.get(id))
      .filter((value): value is string => Boolean(value));
    return [...new Set(values)].slice(0, max).join(", ") || undefined;
  };

  const population = latestQuantity(statements.population ?? []);
  const areaKm2 = quantityInKm2(statements.area ?? []);
  const flagFile = itemIds(statements.flag ?? [])[0];

  const capital = labelList(statements.capital, 3) ?? meta.capital;
  const languages = labelList(statements.languages, 4) ?? meta.languages;
  const currency = labelList(statements.currency, 2) ?? meta.currency;
  const government = labelList(statements.government, 2) ?? meta.government;
  const headOfState = labelList(statements.headOfState, 1);
  const headOfGovernment = labelList(statements.headOfGovernment, 1);

  const populationText = population
    ? `${formatNumber(Math.round(population.amount))}${
        population.year ? ` (${population.year})` : ""
      }`
    : meta.population
      ? formatNumber(meta.population)
      : undefined;
  const areaText = areaKm2
    ? formatArea(areaKm2)
    : meta.areaKm2
      ? formatArea(meta.areaKm2)
      : undefined;

  const facts = [
    fact("Lage", locationValue(meta), "lage"),
    fact("Hauptstadt", capital, "hauptstadt"),
    fact("Einwohnerzahl", populationText, "bevoelkerung"),
    fact("Fläche", areaText, "flaeche"),
    fact("Amtssprache", languages, "sprache"),
    fact("Staatsform", government, "regierung"),
    fact("Währung", currency, "waehrung"),
    fact("Staatsoberhaupt", headOfState, "sonstiges"),
    fact("Regierungschef", headOfGovernment, "sonstiges"),
  ].filter((item): item is Fact => item !== null);

  const liveValues =
    Boolean(summary?.extract) ||
    Object.values(statements).some((list) => (list?.length ?? 0) > 0);
  const expected = Object.keys(PROPERTIES).length;
  const partial = !summary?.extract || Object.keys(statements).length < expected;

  if (!liveValues) return offlineDossier(meta);

  return {
    id: meta.id,
    name: meta.name,
    officialName: meta.officialName,
    description: summary?.description,
    summary: summary?.extract,
    articleUrl: summary?.content_urls?.desktop?.page ?? articleUrl(meta.title),
    imageUrl: summary?.thumbnail?.source,
    flagUrl: flagFile
      ? `${COMMONS_FILE}${encodeURIComponent(flagFile)}?width=160`
      : undefined,
    facts,
    source: "wikipedia",
    partial,
    fetchedAt: Date.now(),
  };
}

type CacheShape = Record<string, CountryDossier>;

function readCache(): CacheShape {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CacheShape) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: CacheShape) {
  if (typeof window === "undefined") return;
  const entries = Object.entries(cache)
    .sort(([, a], [, b]) => b.fetchedAt - a.fetchedAt)
    .slice(0, CACHE_LIMIT);
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // Private mode or a full quota: the in-memory cache still works.
  }
}

const memoryCache = new Map<string, CountryDossier>();
const inFlight = new Map<string, Promise<CountryDossier>>();

function fresh(dossier: CountryDossier | undefined): CountryDossier | null {
  if (!dossier || dossier.source !== "wikipedia") return null;
  return Date.now() - dossier.fetchedAt < CACHE_TTL_MS ? dossier : null;
}

export function cachedDossier(meta: CountryMeta): CountryDossier | null {
  return fresh(memoryCache.get(meta.id)) ?? fresh(readCache()[meta.id]);
}

export function getCountryDossier(
  meta: CountryMeta,
  options: { refresh?: boolean } = {}
): Promise<CountryDossier> {
  if (!options.refresh) {
    const cached = cachedDossier(meta);
    if (cached) {
      memoryCache.set(meta.id, cached);
      return Promise.resolve(cached);
    }
  }
  const pending = inFlight.get(meta.id);
  if (pending && !options.refresh) return pending;

  const request = buildDossier(meta)
    .then((dossier) => {
      memoryCache.set(meta.id, dossier);
      if (dossier.source === "wikipedia") {
        writeCache({ ...readCache(), [meta.id]: dossier });
      }
      return dossier;
    })
    .finally(() => {
      inFlight.delete(meta.id);
    });

  inFlight.set(meta.id, request);
  return request;
}
