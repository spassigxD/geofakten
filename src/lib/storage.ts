import { WORLD_COUNTRIES } from "@/lib/world";
import type { Flashcard, StoreData, StudySet } from "./types";

export const STORAGE_KEY = "geofakten.v1";

export const emptyStore: StoreData = {
  cards: [],
  decks: [],
  studySets: [],
  activeStudySetId: null,
};

const BY_NAME = new Map(
  WORLD_COUNTRIES.map((country) => [country.name, country.id])
);

function withCountryId(card: Flashcard): Flashcard {
  if (card.countryId) return card;
  const id = BY_NAME.get(card.countryName);
  return id ? { ...card, countryId: id } : card;
}

function parseStudySets(value: unknown): StudySet[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is StudySet => {
    if (!item || typeof item !== "object") return false;
    const set = item as StudySet;
    return (
      typeof set.id === "string" &&
      typeof set.name === "string" &&
      Array.isArray(set.countryIds) &&
      Array.isArray(set.categories)
    );
  });
}

export function loadStore(): StoreData {
  if (typeof window === "undefined") return emptyStore;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore;
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    const studySets = parseStudySets(parsed.studySets);
    const active =
      typeof parsed.activeStudySetId === "string" &&
      studySets.some((set) => set.id === parsed.activeStudySetId)
        ? parsed.activeStudySetId
        : null;
    return {
      cards: Array.isArray(parsed.cards)
        ? parsed.cards.map(withCountryId)
        : [],
      decks: Array.isArray(parsed.decks) ? parsed.decks : [],
      studySets,
      activeStudySetId: active,
    };
  } catch {
    return emptyStore;
  }
}

export function saveStore(data: StoreData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
