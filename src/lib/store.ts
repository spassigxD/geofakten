"use client";

import { useSyncExternalStore } from "react";
import { generateCards } from "./cards";
import { applyRating } from "./repetition";
import { emptyStore, loadStore, saveStore } from "./storage";
import { draftsFromMeta } from "./study";
import type {
  ExtractResult,
  Fact,
  FactCategory,
  Flashcard,
  Rating,
  StoreData,
  StudySet,
} from "./types";
import { countryById } from "./world";

let snapshot: StoreData = emptyStore;
let didLoad = false;
const listeners = new Set<() => void>();

function emit() {
  snapshot = {
    cards: snapshot.cards,
    decks: snapshot.decks,
    studySets: snapshot.studySets,
    activeStudySetId: snapshot.activeStudySetId,
  };
  saveStore(snapshot);
  listeners.forEach((listener) => listener());
}

function loadClientStore() {
  if (didLoad || typeof window === "undefined") return;
  snapshot = loadStore();
  didLoad = true;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!didLoad && typeof window !== "undefined") {
    loadClientStore();
    queueMicrotask(() => {
      listeners.forEach((item) => item());
    });
  }
  return () => listeners.delete(listener);
}

function getSnapshot(): StoreData {
  return snapshot;
}

function getServerSnapshot(): StoreData {
  return emptyStore;
}

export function useStore(): StoreData {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function subscribeHydration(onChange: () => void) {
  let active = true;
  queueMicrotask(() => {
    if (active) onChange();
  });
  return () => {
    active = false;
  };
}

export function useHydrated(): boolean {
  return useSyncExternalStore(subscribeHydration, () => true, () => false);
}

function makeCards(
  deckId: string,
  countryName: string,
  countryId: string | undefined,
  facts: Fact[],
  now: number
): Flashcard[] {
  return generateCards(countryName, facts).map((draft) => ({
    id: crypto.randomUUID(),
    deckId,
    countryName,
    countryId,
    question: draft.question,
    answer: draft.answer,
    extraHint: draft.extraHint,
    category: draft.category,
    mastery: "learn" as const,
    intervalDays: 0,
    nextReviewAt: now,
    reviewCount: 0,
    consecutiveCorrect: 0,
    createdAt: now,
  }));
}

function sameFactCard(card: Flashcard, fact: Fact) {
  if (fact.category === "sonstiges") {
    return (
      card.category === "sonstiges" && card.question.startsWith(fact.label)
    );
  }
  if (fact.category === "flagge") {
    return card.category === "flagge";
  }
  return card.category === fact.category;
}

/**
 * Adds only the given facts as cards. Wikipedia/map saves merge into an
 * existing country deck so ratings survive a second visit.
 */
export function upsertCountryFacts(
  result: ExtractResult,
  facts: Fact[],
  thumbnail?: string
): { deckId: string; added: number } {
  loadClientStore();
  const usable = facts.filter((fact) => fact.value.trim());
  if (usable.length === 0) return { deckId: "", added: 0 };

  const now = Date.now();
  const countryId = result.countryId;
  const merge =
    result.source === "wikipedia" &&
    snapshot.decks.find(
      (deck) =>
        deck.source === "wikipedia" &&
        ((countryId && deck.countryId === countryId) ||
          deck.countryName === result.countryName)
    );

  if (merge) {
    const existingCards = snapshot.cards.filter((card) => card.deckId === merge.id);
    const newFacts = usable.filter(
      (fact) => !existingCards.some((card) => sameFactCard(card, fact))
    );
    const addedCards = makeCards(
      merge.id,
      result.countryName,
      countryId,
      newFacts,
      now
    );
    const factKey = (fact: Fact) => `${fact.category}:${fact.label}`;
    const seen = new Set(merge.facts.map(factKey));
    const mergedFacts = [...merge.facts];
    for (const fact of usable) {
      if (seen.has(factKey(fact))) continue;
      seen.add(factKey(fact));
      mergedFacts.push(fact);
    }
    snapshot = {
      ...snapshot,
      decks: snapshot.decks.map((deck) =>
        deck.id === merge.id
          ? {
              ...deck,
              facts: mergedFacts,
              officialName: result.officialName ?? deck.officialName,
              countryId: countryId ?? deck.countryId,
              thumbnail: thumbnail ?? deck.thumbnail,
            }
          : deck
      ),
      cards: [...addedCards, ...snapshot.cards],
    };
    emit();
    return { deckId: merge.id, added: addedCards.length };
  }

  const deckId = crypto.randomUUID();
  snapshot = {
    ...snapshot,
    decks: [
      {
        id: deckId,
        countryName: result.countryName,
        officialName: result.officialName,
        countryId,
        facts: usable,
        thumbnail,
        source: result.source,
        createdAt: now,
      },
      ...snapshot.decks,
    ],
    cards: [
      ...makeCards(deckId, result.countryName, countryId, usable, now),
      ...snapshot.cards,
    ],
  };
  emit();
  return { deckId, added: usable.length };
}

export function addExtracted(result: ExtractResult, thumbnail?: string): string {
  const facts = result.facts;
  return upsertCountryFacts(result, facts, thumbnail).deckId;
}

function ensureCardsForSet(set: StudySet) {
  const now = Date.now();
  let decks = snapshot.decks;
  let cards = snapshot.cards;

  for (const countryId of set.countryIds) {
    const meta = countryById(countryId);
    if (!meta) continue;
    const { facts } = draftsFromMeta(meta, set.categories);
    if (facts.length === 0) continue;

    let deck = decks.find(
      (item) => item.countryId === countryId && item.source === "wikipedia"
    );
    if (!deck) {
      deck = {
        id: crypto.randomUUID(),
        countryName: meta.name,
        officialName: meta.officialName,
        countryId,
        facts,
        source: "wikipedia",
        createdAt: now,
      };
      decks = [deck, ...decks];
    }

    const existing = cards.filter((card) => card.deckId === deck.id);
    const missing = facts.filter(
      (fact) => !existing.some((card) => sameFactCard(card, fact))
    );
    if (missing.length === 0) continue;
    const added = makeCards(deck.id, meta.name, countryId, missing, now);
    cards = [...added, ...cards];
    const factKey = (fact: Fact) => `${fact.category}:${fact.label}`;
    const seen = new Set(deck.facts.map(factKey));
    const mergedFacts = [...deck.facts];
    for (const fact of facts) {
      if (seen.has(factKey(fact))) continue;
      seen.add(factKey(fact));
      mergedFacts.push(fact);
    }
    const deckId = deck.id;
    decks = decks.map((item) =>
      item.id === deckId ? { ...item, facts: mergedFacts } : item
    );
  }

  snapshot = { ...snapshot, decks, cards };
}

export function createStudySet(input: {
  name: string;
  continent?: StudySet["continent"];
  countryIds: string[];
  categories: FactCategory[];
}): StudySet {
  loadClientStore();
  const now = Date.now();
  const set: StudySet = {
    id: crypto.randomUUID(),
    name: input.name.trim() || "Neuer Stapel",
    continent: input.continent,
    countryIds: [...new Set(input.countryIds)],
    categories: input.categories,
    createdAt: now,
    updatedAt: now,
  };
  snapshot = {
    ...snapshot,
    studySets: [set, ...snapshot.studySets],
    activeStudySetId: set.id,
  };
  ensureCardsForSet(set);
  emit();
  return set;
}

export function updateStudySet(
  id: string,
  patch: Partial<Pick<StudySet, "name" | "countryIds" | "categories" | "continent">>
): void {
  loadClientStore();
  const current = snapshot.studySets.find((set) => set.id === id);
  if (!current) return;
  const next: StudySet = {
    ...current,
    name: patch.name?.trim() || current.name,
    countryIds: patch.countryIds
      ? [...new Set(patch.countryIds)]
      : current.countryIds,
    categories: patch.categories ?? current.categories,
    continent: patch.continent ?? current.continent,
    updatedAt: Date.now(),
  };
  snapshot = {
    ...snapshot,
    studySets: snapshot.studySets.map((set) => (set.id === id ? next : set)),
  };
  ensureCardsForSet(next);
  emit();
}

export function deleteStudySet(id: string): void {
  loadClientStore();
  snapshot = {
    ...snapshot,
    studySets: snapshot.studySets.filter((set) => set.id !== id),
    activeStudySetId:
      snapshot.activeStudySetId === id ? null : snapshot.activeStudySetId,
  };
  emit();
}

export function setActiveStudySet(id: string | null): void {
  loadClientStore();
  snapshot = {
    ...snapshot,
    activeStudySetId:
      id && snapshot.studySets.some((set) => set.id === id) ? id : null,
  };
  emit();
}

export function rateCard(cardId: string, rating: Rating) {
  loadClientStore();
  snapshot = {
    ...snapshot,
    cards: snapshot.cards.map((card) =>
      card.id === cardId ? applyRating(card, rating) : card
    ),
  };
  emit();
}

export function deleteDeck(deckId: string) {
  loadClientStore();
  snapshot = {
    ...snapshot,
    decks: snapshot.decks.filter((deck) => deck.id !== deckId),
    cards: snapshot.cards.filter((card) => card.deckId !== deckId),
  };
  emit();
}

export function deleteCard(cardId: string) {
  loadClientStore();
  const card = snapshot.cards.find((item) => item.id === cardId);
  const cards = snapshot.cards.filter((item) => item.id !== cardId);
  let decks = snapshot.decks;
  if (card) {
    const remaining = cards.filter((item) => item.deckId === card.deckId);
    if (remaining.length === 0) {
      decks = decks.filter((deck) => deck.id !== card.deckId);
    }
  }
  snapshot = { ...snapshot, cards, decks };
  emit();
}

export function clearAll() {
  loadClientStore();
  snapshot = emptyStore;
  emit();
}
