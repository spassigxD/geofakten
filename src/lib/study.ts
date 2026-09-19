import { generateCards } from "@/lib/cards";
import { continentLabels } from "@/lib/geo";
import { categoryLabels } from "@/lib/labels";
import type {
  ContinentId,
  Fact,
  FactCategory,
  Flashcard,
  StudySet,
} from "@/lib/types";
import { offlineDossier } from "@/lib/wikipedia";
import {
  type CountryMeta,
  WORLD_COUNTRIES,
  countriesOnContinent,
  countryById,
} from "@/lib/world";

export const STUDY_CATEGORIES: FactCategory[] = [
  "lage",
  "hauptstadt",
  "bevoelkerung",
  "flaeche",
  "sprache",
  "regierung",
  "waehrung",
];

export const STACK_CATEGORIES: FactCategory[] = [
  ...STUDY_CATEGORIES,
  "flagge",
];

export const ALL_FACT_CATEGORIES: FactCategory[] = [
  ...STACK_CATEGORIES,
  "sonstiges",
];

export const CONTINENT_ORDER: ContinentId[] = [
  "africa",
  "asia",
  "europe",
  "north-america",
  "south-america",
  "oceania",
];

export function defaultStudyCategories(): FactCategory[] {
  return ["hauptstadt", "lage", "waehrung"];
}

export function continentStackName(
  continent: ContinentId,
  categories: FactCategory[]
): string {
  if (categories.length === 1) {
    return `${continentLabels[continent]} – ${categoryLabels[categories[0]]}`;
  }
  return `${continentLabels[continent]} üben`;
}

export function factsForCategories(
  meta: CountryMeta,
  categories: FactCategory[]
): Fact[] {
  const allowed = new Set(categories);
  const facts = offlineDossier(meta).facts.filter((fact) =>
    allowed.has(fact.category)
  );
  if (allowed.has("flagge") && meta.iso2) {
    facts.push({ label: "Flagge", value: meta.name, category: "flagge" });
  }
  return facts;
}

export function selectedFacts(facts: Fact[], labels: string[]): Fact[] {
  const allowed = new Set(labels);
  return facts.filter((fact) => allowed.has(fact.label));
}

export function cardsInStudySet(
  cards: Flashcard[],
  set: StudySet | null | undefined
): Flashcard[] {
  if (!set) return cards;
  const countries = new Set(set.countryIds);
  const categories = new Set(set.categories);
  return cards.filter(
    (card) =>
      Boolean(card.countryId) &&
      countries.has(card.countryId as string) &&
      categories.has(card.category)
  );
}

export function studySetSummary(set: StudySet, cards: Flashcard[]): string {
  const count = cardsInStudySet(cards, set).length;
  const countries = set.countryIds.length;
  const facts = set.categories
    .map((category) => categoryLabels[category])
    .join(", ");
  return `${countries} ${countries === 1 ? "Land" : "Länder"} · ${count} ${
    count === 1 ? "Karte" : "Karten"
  } · ${facts || "keine Faktenarten"}`;
}

export function draftsFromMeta(
  meta: CountryMeta,
  categories: FactCategory[]
) {
  const facts = factsForCategories(meta, categories);
  return { facts, drafts: generateCards(meta.name, facts) };
}

export function sovereignOnContinent(continent: ContinentId): CountryMeta[] {
  return countriesOnContinent(continent, true);
}

export function countryIdsOnContinent(continent: ContinentId): string[] {
  return sovereignOnContinent(continent).map((country) => country.id);
}

export function resolveCountryIds(ids: string[]): CountryMeta[] {
  return ids
    .map((id) => countryById(id))
    .filter((country): country is CountryMeta => country !== null);
}

export function allSovereignIds(): string[] {
  return WORLD_COUNTRIES.filter((country) => country.kind === "country").map(
    (country) => country.id
  );
}
