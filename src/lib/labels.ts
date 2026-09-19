import type { FactCategory, Mastery } from "./types";

export const masteryLabels: Record<Mastery, string> = {
  learn: "Nochmal lernen",
  good: "Gut können",
  mastered: "Sehr gut können",
};

export const masteryHints: Record<Mastery, string> = {
  learn: "Kommt bald wieder.",
  good: "In ein paar Tagen erneut.",
  mastered: "Selten, aber nicht vergessen.",
};

export const categoryLabels: Record<FactCategory, string> = {
  lage: "Lage",
  hauptstadt: "Hauptstadt",
  bevoelkerung: "Einwohner",
  flaeche: "Fläche",
  sprache: "Sprache",
  regierung: "Staatsform",
  waehrung: "Währung",
  sonstiges: "Weitere Fakten",
};

export const ratingLabels: Record<1 | 2 | 3, string> = {
  1: "Nochmal lernen",
  2: "Gut können",
  3: "Sehr gut können",
};
