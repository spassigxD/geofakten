import type { Flashcard, Mastery, Rating } from "./types";

export const DAY_MS = 24 * 60 * 60 * 1000;

export function masteryFromRating(rating: Rating): Mastery {
  if (rating === 1) return "learn";
  if (rating === 2) return "good";
  return "mastered";
}

export function applyRating(card: Flashcard, rating: Rating, now = Date.now()): Flashcard {
  const mastery = masteryFromRating(rating);
  let intervalDays = card.intervalDays;
  let nextReviewAt = now;
  let consecutiveCorrect = card.consecutiveCorrect;

  if (rating === 1) {
    intervalDays = 0;
    nextReviewAt = now;
    consecutiveCorrect = 0;
  } else if (rating === 2) {
    intervalDays = Math.max(1, Math.round((intervalDays || 0.5) * 1.5));
    nextReviewAt = now + intervalDays * DAY_MS;
    consecutiveCorrect += 1;
  } else {
    intervalDays = intervalDays < 1 ? 4 : Math.round(intervalDays * 2.2);
    nextReviewAt = now + intervalDays * DAY_MS;
    consecutiveCorrect += 1;
  }

  return {
    ...card,
    mastery,
    intervalDays,
    nextReviewAt,
    consecutiveCorrect,
    reviewCount: card.reviewCount + 1,
    lastReviewedAt: now,
    lastRating: rating,
  };
}

function weight(card: Flashcard): number {
  if (card.mastery === "learn") return 8;
  if (card.mastery === "good") return 3;
  return 1;
}

export function isDue(card: Flashcard, now = Date.now()): boolean {
  return card.nextReviewAt <= now;
}

export function pickSession(cards: Flashcard[], size = 10, now = Date.now()): Flashcard[] {
  if (cards.length === 0) return [];

  const due = cards.filter((card) => isDue(card, now));
  const later = cards.filter((card) => !isDue(card, now));

  due.sort((a, b) => {
    const byWeight = weight(b) - weight(a);
    if (byWeight !== 0) return byWeight;
    return a.nextReviewAt - b.nextReviewAt;
  });

  const picked = due.slice(0, size);
  if (picked.length >= size) return shuffle(picked);

  const pool = [...later];
  while (picked.length < size && pool.length > 0) {
    const total = pool.reduce((sum, card) => sum + weight(card), 0);
    let r = Math.random() * total;
    let idx = pool.findIndex((card) => {
      r -= weight(card);
      return r <= 0;
    });
    if (idx < 0) idx = 0;
    picked.push(pool.splice(idx, 1)[0]);
  }

  return shuffle(picked);
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function dueCount(cards: Flashcard[], now = Date.now()): number {
  return cards.filter((card) => isDue(card, now)).length;
}

export function countByMastery(cards: Flashcard[]): Record<Mastery, number> {
  return {
    learn: cards.filter((c) => c.mastery === "learn").length,
    good: cards.filter((c) => c.mastery === "good").length,
    mastered: cards.filter((c) => c.mastery === "mastered").length,
  };
}
