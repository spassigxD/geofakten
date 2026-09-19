import type { DraftCard, Fact, FactCategory } from "./types";

function articleFor(country: string): string {
  return country.startsWith("Vereinigte") ? "den " : "";
}

export function questionFor(country: string, fact: Fact): { question: string; answer: string } {
  const c = country;
  const den = articleFor(c);

  switch (fact.category) {
    case "hauptstadt":
      return {
        question: `Wie heißt die Hauptstadt von ${c}?`,
        answer: fact.value,
      };
    case "lage":
      return {
        question: `Wo liegt ${c}?`,
        answer: fact.value,
      };
    case "bevoelkerung":
      return {
        question: `Wie viele Einwohner hat ${c}?`,
        answer: fact.value,
      };
    case "flaeche":
      return {
        question: `Wie groß ist die Fläche von ${c}?`,
        answer: fact.value,
      };
    case "sprache":
      return {
        question: `Welche Amtssprache hat ${c}?`,
        answer: fact.value,
      };
    case "regierung":
      return {
        question: `Welche Staatsform hat ${c}?`,
        answer: fact.value,
      };
    case "waehrung":
      return {
        question: `Welche Währung hat ${c}?`,
        answer: fact.value,
      };
    case "flagge":
      return {
        question: "Welches Land hat diese Flagge?",
        answer: c,
      };
    default:
      return {
        question: `${fact.label} ${den}${c}?`.replace("  ", " "),
        answer: fact.value,
      };
  }
}

export function generateCards(countryName: string, facts: Fact[]): DraftCard[] {
  const unique = dedupeFacts(facts);
  const flags = unique.filter((fact) => fact.category === "flagge").slice(0, 1);
  const rest = unique
    .filter((fact) => fact.category !== "flagge")
    .slice(0, 8);
  return [...flags, ...rest].map((fact) => {
    const { question, answer } = questionFor(countryName, fact);
    const extraHint = rest
      .filter((other) => other !== fact)
      .slice(0, 3)
      .map((other) => `${other.label}: ${other.value}`)
      .join(" · ");
    return {
      question,
      answer,
      extraHint: extraHint || undefined,
      category: fact.category,
    };
  });
}

export function dedupeFacts(facts: Fact[]): Fact[] {
  const seen = new Set<string>();
  const out: Fact[] = [];
  for (const fact of facts) {
    const key = `${fact.category}:${fact.label}:${fact.value.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(fact);
  }
  return out;
}

const CATEGORIES: FactCategory[] = [
  "lage",
  "hauptstadt",
  "bevoelkerung",
  "flaeche",
  "sprache",
  "regierung",
  "waehrung",
  "flagge",
  "sonstiges",
];

export function isFactCategory(value: string): value is FactCategory {
  return CATEGORIES.includes(value as FactCategory);
}
