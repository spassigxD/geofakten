import { findCountry } from "@/lib/world";

/**
 * Flag images that work from a static GitHub Pages origin (CORS, no key).
 * flagcdn first; Wikimedia / country-flag-icons as fallbacks.
 */
export function flagSources(iso2: string | undefined): string[] {
  const code = iso2?.trim().toLowerCase();
  if (!code || code.length !== 2) return [];
  const upper = code.toUpperCase();
  return [
    `https://flagcdn.com/w160/${code}.png`,
    `https://flagcdn.com/${code}.svg`,
    `https://purecatamphetamine.github.io/country-flag-icons/3x2/${upper}.svg`,
  ];
}

export function iso2ForCountry(
  countryId?: string,
  countryName?: string
): string | undefined {
  const meta = findCountry(countryId) ?? findCountry(countryName);
  return meta?.iso2;
}

/** Old country-first prompt — dropped; flag study always shows the flag first. */
export function isCountryFirstFlagQuestion(question: string): boolean {
  return question.startsWith("Wie sieht die Flagge");
}
