"use client";

import { useSyncExternalStore } from "react";
import { generateCards } from "./cards";
import { applyRating } from "./repetition";
import { emptyStore, loadStore, saveStore } from "./storage";
import type {
  Deck,
  ExtractResult,
  Flashcard,
  Rating,
  StoreData,
} from "./types";

let snapshot: StoreData = emptyStore;
let didLoad = false;
const listeners = new Set<() => void>();

function emit() {
  snapshot = { cards: snapshot.cards, decks: snapshot.decks };
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

export function addExtracted(result: ExtractResult, thumbnail?: string): string {
  loadClientStore();
  const now = Date.now();
  const deckId = crypto.randomUUID();
  const deck: Deck = {
    id: deckId,
    countryName: result.countryName,
    officialName: result.officialName,
    facts: result.facts,
    thumbnail,
    source: result.source,
    createdAt: now,
  };
  const drafts = result.cards.length
    ? result.cards
    : generateCards(result.countryName, result.facts);

  const cards: Flashcard[] = drafts.map((draft) => ({
    id: crypto.randomUUID(),
    deckId,
    countryName: result.countryName,
    question: draft.question,
    answer: draft.answer,
    extraHint: draft.extraHint,
    category: draft.category,
    mastery: "learn",
    intervalDays: 0,
    nextReviewAt: now,
    reviewCount: 0,
    consecutiveCorrect: 0,
    createdAt: now,
  }));

  snapshot = {
    decks: [deck, ...snapshot.decks],
    cards: [...cards, ...snapshot.cards],
  };
  emit();
  return deckId;
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
  snapshot = { cards, decks };
  emit();
}

export function clearAll() {
  loadClientStore();
  snapshot = emptyStore;
  emit();
}
