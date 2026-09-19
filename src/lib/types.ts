export type Mastery = "learn" | "good" | "mastered";

export type FactCategory =
  | "lage"
  | "hauptstadt"
  | "bevoelkerung"
  | "flaeche"
  | "sprache"
  | "regierung"
  | "waehrung"
  | "sonstiges";

export type ExtractSource = "vision" | "mock";

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
  facts: Fact[];
  thumbnail?: string;
  source: ExtractSource;
  createdAt: number;
}

export interface Flashcard {
  id: string;
  deckId: string;
  countryName: string;
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

export interface ExtractResult {
  source: ExtractSource;
  usedFallback: boolean;
  fallbackReason?: string;
  countryName: string;
  officialName?: string;
  facts: Fact[];
  cards: DraftCard[];
}

export interface StoreData {
  cards: Flashcard[];
  decks: Deck[];
}

export type Rating = 1 | 2 | 3;
