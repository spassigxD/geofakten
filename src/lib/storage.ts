import type { StoreData } from "./types";

export const STORAGE_KEY = "geofakten.v1";

export const emptyStore: StoreData = { cards: [], decks: [] };

export function loadStore(): StoreData {
  if (typeof window === "undefined") return emptyStore;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore;
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
      cards: Array.isArray(parsed.cards) ? parsed.cards : [],
      decks: Array.isArray(parsed.decks) ? parsed.decks : [],
    };
  } catch {
    return emptyStore;
  }
}

export function saveStore(data: StoreData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
