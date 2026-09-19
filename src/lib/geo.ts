import continents from "../data/continents.json";
import { findCountryProfile } from "@/lib/countries";
import type { ContinentId, CountryLocation } from "@/lib/types";

export type MapView = {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
};

export type CountryFeature = {
  iso: string;
  continent: ContinentId;
  name: string;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
};

const CONTINENT_FROM_NE: Record<string, ContinentId> = {
  Africa: "africa",
  Asia: "asia",
  Europe: "europe",
  "North America": "north-america",
  Oceania: "oceania",
  "South America": "south-america",
};

export const continentLabels: Record<ContinentId, string> = {
  africa: "Afrika",
  asia: "Asien",
  europe: "Europa",
  "north-america": "Nordamerika",
  oceania: "Australien und Ozeanien",
  "south-america": "Südamerika",
};

/** Learner-friendly crop of each continent (not the full globe extent). */
export const CONTINENT_VIEWS: Record<ContinentId, MapView> = {
  africa: { minLon: -20, minLat: -36, maxLon: 54, maxLat: 38 },
  asia: { minLon: 24, minLat: -12, maxLon: 150, maxLat: 56 },
  europe: { minLon: -25, minLat: 34, maxLon: 42, maxLat: 72 },
  "north-america": { minLon: -170, minLat: 5, maxLon: -52, maxLat: 84 },
  oceania: { minLon: 110, minLat: -48, maxLon: 180, maxLat: -5 },
  "south-america": { minLon: -85, minLat: -58, maxLon: -32, maxLat: 15 },
};

type RawCollection = {
  features: {
    properties: { iso: string; continent: string; name: string };
    geometry: CountryFeature["geometry"];
  }[];
};

/** Simplified Natural Earth 110m admin-0 countries (public domain). */
const raw = continents as RawCollection;

export const COUNTRY_FEATURES: CountryFeature[] = raw.features.flatMap(
  (feature) => {
    const continent = CONTINENT_FROM_NE[feature.properties.continent];
    if (!continent) return [];
    return [
      {
        iso: feature.properties.iso,
        continent,
        name: feature.properties.name,
        geometry: feature.geometry,
      },
    ];
  }
);

const CONTINENT_HINTS: { pattern: RegExp; continent: ContinentId }[] = [
  { pattern: /suedamerika|suedamerikan/, continent: "south-america" },
  { pattern: /nordamerika|nordamerikan/, continent: "north-america" },
  { pattern: /mittelamerika|zentralamerika/, continent: "north-america" },
  { pattern: /ozeanien|pazifik|australien/, continent: "oceania" },
  { pattern: /afrika|afrikan/, continent: "africa" },
  { pattern: /asien|asiatisch|vorderasien|ostasien|suedasien/, continent: "asia" },
  {
    pattern: /europa|europaeisch|mitteleuropa|westeuropa|nordeuropa|suedeuropa|osteuropa/,
    continent: "europe",
  },
];

export function resolveMapLocation(
  countryName: string,
  lageText?: string
): CountryLocation | null {
  const fromName = findCountryProfile(countryName);
  if (fromName?.location) return fromName.location;

  const haystack = `${countryName} ${lageText ?? ""}`;
  const fromText = findCountryProfile(haystack);
  if (fromText?.location) return fromText.location;

  const continent = inferContinent(haystack);
  if (!continent) return null;
  const view = CONTINENT_VIEWS[continent];
  return {
    continent,
    iso: "",
    lat: (view.minLat + view.maxLat) / 2,
    lon: (view.minLon + view.maxLon) / 2,
  };
}

export function inferContinent(text: string): ContinentId | null {
  const n = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ß/g, "ss");
  for (const hint of CONTINENT_HINTS) {
    if (hint.pattern.test(n)) return hint.continent;
  }
  return null;
}

export function featuresForContinent(continent: ContinentId): CountryFeature[] {
  return COUNTRY_FEATURES.filter((feature) => feature.continent === continent);
}

export function project(
  lon: number,
  lat: number,
  view: MapView,
  width: number,
  height: number
): [number, number] {
  const x = ((lon - view.minLon) / (view.maxLon - view.minLon)) * width;
  const y = ((view.maxLat - lat) / (view.maxLat - view.minLat)) * height;
  return [x, y];
}

function ringPath(
  ring: number[][],
  view: MapView,
  width: number,
  height: number
): string | null {
  if (ring.length < 3) return null;
  let inside = false;
  const parts: string[] = [];
  for (let i = 0; i < ring.length; i += 1) {
    const lon = ring[i][0];
    const lat = ring[i][1];
    if (
      lon >= view.minLon - 8 &&
      lon <= view.maxLon + 8 &&
      lat >= view.minLat - 8 &&
      lat <= view.maxLat + 8
    ) {
      inside = true;
    }
    const [x, y] = project(lon, lat, view, width, height);
    parts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  if (!inside) return null;
  return `${parts.join("")}Z`;
}

export function geometryToPath(
  geometry: CountryFeature["geometry"],
  view: MapView,
  width: number,
  height: number
): string {
  const rings: number[][][] = [];
  if (geometry.type === "Polygon") {
    rings.push(...(geometry.coordinates as number[][][]));
  } else {
    for (const polygon of geometry.coordinates as number[][][][]) {
      rings.push(...polygon);
    }
  }
  return rings
    .map((ring) => ringPath(ring, view, width, height))
    .filter((path): path is string => Boolean(path))
    .join(" ");
}
