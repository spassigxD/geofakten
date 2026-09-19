import { WORLD_COUNTRIES } from "@/lib/world";
import { isCountryFirstFlagQuestion } from "@/lib/flags";
import type { Deck, Flashcard, StoreData, StudySet } from "./types";

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

function withoutCountryFirstFlagFacts(decks: Deck[]): Deck[] {
  return decks.map((deck) => ({
    ...deck,
    facts: (deck.facts ?? []).filter((fact) => fact.label !== "Landesflagge"),
  }));
}

/**
 * Flag study is flag → country only. Drop or rewrite the old
 * “Wie sieht die Flagge von … aus?” cards so existing libraries stay usable.
 */
function migrateFlagCards(cards: Flashcard[]): Flashcard[] {
  const recognizeKeys = new Set<string>();
  for (const card of cards) {
    if (card.category !== "flagge") continue;
    if (isCountryFirstFlagQuestion(card.question)) continue;
    recognizeKeys.add(`${card.deckId}:${card.countryId ?? card.countryName}`);
  }

  const out: Flashcard[] = [];
  for (const card of cards) {
    if (
      card.category === "flagge" &&
      isCountryFirstFlagQuestion(card.question)
    ) {
      const key = `${card.deckId}:${card.countryId ?? card.countryName}`;
      if (recognizeKeys.has(key)) continue;
      out.push({
        ...card,
        question: "Welches Land hat diese Flagge?",
        answer: card.countryName,
      });
      recognizeKeys.add(key);
      continue;
    }
    out.push(card);
  }
  return out;
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
    const cards = Array.isArray(parsed.cards)
      ? migrateFlagCards(parsed.cards.map(withCountryId))
      : [];
    const decks = Array.isArray(parsed.decks)
      ? withoutCountryFirstFlagFacts(parsed.decks as Deck[])
      : [];
    const data: StoreData = {
      cards,
      decks,
      studySets,
      activeStudySetId: active,
    };
    const hadCountryFirst = Array.isArray(parsed.cards)
      ? parsed.cards.some(
          (card) =>
            card &&
            typeof card === "object" &&
            isCountryFirstFlagQuestion(
              String((card as Flashcard).question ?? "")
            )
        )
      : false;
    if (hadCountryFirst) saveStore(data);
    return data;
  } catch {
    return emptyStore;
  }
}

export function saveStore(data: StoreData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
