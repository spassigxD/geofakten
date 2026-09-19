import { generateCards } from "@/lib/cards";
import {
  COUNTRY_PROFILES,
  DEFAULT_PROFILE,
  findCountryProfile,
  type CountryProfile,
} from "@/lib/countries";
import type { ExtractResult } from "@/lib/types";

export function extractFromFilename(filename: string): ExtractResult {
  const profile = findCountryProfile(filename);
  if (profile) {
    return toResult(profile, {
      usedFallback: true,
      fallbackReason: `Ohne API-Schlüssel: „${profile.name}“ wurde am Dateinamen erkannt.`,
    });
  }

  return toResult(DEFAULT_PROFILE, {
    usedFallback: true,
    fallbackReason:
      "Ohne API-Schlüssel und ohne erkennbaren Ländernamen: Es wird das Beispiel Venezuela ausgewertet, damit du die App trotzdem testen kannst.",
  });
}

export function extractFromText(text: string): ExtractResult | null {
  const profile = findCountryProfile(text);
  if (!profile) return null;
  return toResult(profile, {
    usedFallback: true,
    fallbackReason: `Ohne API-Schlüssel: „${profile.name}“ wurde im Dateiinhalt erkannt.`,
  });
}

export function profileByName(name: string): CountryProfile | undefined {
  return COUNTRY_PROFILES.find(
    (profile) => profile.name.toLowerCase() === name.toLowerCase()
  );
}

function toResult(
  profile: CountryProfile,
  meta: { usedFallback: boolean; fallbackReason?: string }
): ExtractResult {
  return {
    source: "mock",
    usedFallback: meta.usedFallback,
    fallbackReason: meta.fallbackReason,
    countryName: profile.name,
    officialName: profile.officialName,
    facts: profile.facts,
    cards: generateCards(profile.name, profile.facts),
  };
}
