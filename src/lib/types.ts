export type Mastery = "learn" | "good" | "mastered";

export type ContinentId =
  | "africa"
  | "asia"
  | "europe"
  | "north-america"
  | "oceania"
  | "south-america";

export interface CountryLocation {
  continent: ContinentId;
  iso: string;
  lat: number;
  lon: number;
}

export type FactCategory =
  | "lage"
  | "hauptstadt"
  | "bevoelkerung"
  | "flaeche"
  | "sprache"
  | "regierung"
  | "waehrung"
  | "flagge"
  | "sonstiges";

export type ExtractSource = "vision" | "mock" | "wikipedia";

export interface Fact {
  label: string;
  value: string;
  category: FactCategory;
}

export interface DraftCard {
  question: string;
  answer: string;
  extraHint?: string;
  category: FactCategory;
}

export interface Deck {
  id: string;
  countryName: string;
  officialName?: string;
  /** Natural Earth ADM0_A3 when the deck came from the map. */
  countryId?: string;
  facts: Fact[];
  thumbnail?: string;
  source: ExtractSource;
  createdAt: number;
}

export interface Flashcard {
  id: string;
  deckId: string;
  countryName: string;
  countryId?: string;
  question: string;
  answer: string;
  extraHint?: string;
  category: FactCategory;
  mastery: Mastery;
  intervalDays: number;
  nextReviewAt: number;
  reviewCount: number;
  consecutiveCorrect: number;
  lastReviewedAt?: number;
  lastRating?: 1 | 2 | 3;
  createdAt: number;
}

/**
 * A named study stack: selected countries × selected fact types.
 * Cards stay in the global library; the set only chooses which ones to drill.
 */
export interface StudySet {
  id: string;
  name: string;
  continent?: ContinentId;
  countryIds: string[];
  categories: FactCategory[];
  createdAt: number;
  updatedAt: number;
}

export interface ExtractResult {
  source: ExtractSource;
  usedFallback: boolean;
  fallbackReason?: string;
  countryName: string;
  officialName?: string;
  countryId?: string;
  facts: Fact[];
  cards: DraftCard[];
}

export interface StoreData {
  cards: Flashcard[];
  decks: Deck[];
  studySets: StudySet[];
  /** `null` = every card in the library. */
  activeStudySetId: string | null;
}

export type Rating = 1 | 2 | 3;
