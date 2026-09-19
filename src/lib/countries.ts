import type { ContinentId, CountryLocation, Fact } from "./types";

export interface CountryProfile {
  name: string;
  officialName?: string;
  aliases: string[];
  location: CountryLocation;
  facts: Fact[];
}

function f(
  label: string,
  value: string,
  category: Fact["category"]
): Fact {
  return { label, value, category };
}

function loc(
  continent: ContinentId,
  iso: string,
  lat: number,
  lon: number
): CountryLocation {
  return { continent, iso, lat, lon };
}

export const COUNTRY_PROFILES: CountryProfile[] = [
  {
    name: "Venezuela",
    officialName: "Bolivarische Republik Venezuela",
    aliases: [
      "venezuela",
      "venezolan",
      "bolivarische republik",
      "caracas",
    ],
    location: loc("south-america", "VEN", 8.0, -66.0),
    facts: [
      f("Lage", "an der Nordküste Südamerikas, zur Karibik hin", "lage"),
      f("Hauptstadt", "Caracas", "hauptstadt"),
      f("Einwohnerzahl", "rund 28,6 Millionen", "bevoelkerung"),
      f("Fläche", "912.050 km²", "flaeche"),
      f("Amtssprache", "Spanisch", "sprache"),
      f(
        "Staatsform",
        "Bundesstaat mit präsidentiellem Regierungssystem",
        "regierung"
      ),
      f("Währung", "Venezolanischer Bolívar (VES)", "waehrung"),
    ],
  },
  {
    name: "Deutschland",
    officialName: "Bundesrepublik Deutschland",
    aliases: ["deutschland", "germany", "bundesrepublik", "berlin"],
    location: loc("europe", "DEU", 51.2, 10.4),
    facts: [
      f("Lage", "in Mitteleuropa, zwischen Nord- und Ostsee und den Alpen", "lage"),
      f("Hauptstadt", "Berlin", "hauptstadt"),
      f("Einwohnerzahl", "rund 84,7 Millionen", "bevoelkerung"),
      f("Fläche", "357.588 km²", "flaeche"),
      f("Amtssprache", "Deutsch", "sprache"),
      f("Staatsform", "föderale parlamentarische Republik", "regierung"),
      f("Währung", "Euro (EUR)", "waehrung"),
    ],
  },
  {
    name: "Frankreich",
    officialName: "Französische Republik",
    aliases: ["frankreich", "france", "französische republik", "paris"],
    location: loc("europe", "FRA", 46.2, 2.2),
    facts: [
      f("Lage", "in Westeuropa, mit Küsten an Atlantik und Mittelmeer", "lage"),
      f("Hauptstadt", "Paris", "hauptstadt"),
      f("Einwohnerzahl", "rund 68 Millionen", "bevoelkerung"),
      f("Fläche", "543.940 km² (Mutterland)", "flaeche"),
      f("Amtssprache", "Französisch", "sprache"),
      f("Staatsform", "semipräsidentielle Republik", "regierung"),
      f("Währung", "Euro (EUR)", "waehrung"),
    ],
  },
  {
    name: "Japan",
    officialName: "Staat Japan",
    aliases: ["japan", "nippon", "nihon", "tokio", "tokyo"],
    location: loc("asia", "JPN", 36.2, 138.3),
    facts: [
      f("Lage", "Inselstaat in Ostasien, im Pazifik vor dem asiatischen Festland", "lage"),
      f("Hauptstadt", "Tokio", "hauptstadt"),
      f("Einwohnerzahl", "rund 124 Millionen", "bevoelkerung"),
      f("Fläche", "377.975 km²", "flaeche"),
      f("Amtssprache", "Japanisch", "sprache"),
      f("Staatsform", "parlamentarische konstitutionelle Monarchie", "regierung"),
      f("Währung", "Yen (JPY)", "waehrung"),
    ],
  },
  {
    name: "Brasilien",
    officialName: "Föderative Republik Brasilien",
    aliases: ["brasilien", "brazil", "brasil", "brasília", "brasilia"],
    location: loc("south-america", "BRA", -10.8, -53.1),
    facts: [
      f("Lage", "nimmt den Großteil Südamerikas ein, Atlantikküste im Osten", "lage"),
      f("Hauptstadt", "Brasília", "hauptstadt"),
      f("Einwohnerzahl", "rund 216 Millionen", "bevoelkerung"),
      f("Fläche", "8.515.767 km²", "flaeche"),
      f("Amtssprache", "Portugiesisch", "sprache"),
      f("Staatsform", "föderale präsidentielle Republik", "regierung"),
      f("Währung", "Brasilianischer Real (BRL)", "waehrung"),
    ],
  },
  {
    name: "Kenia",
    officialName: "Republik Kenia",
    aliases: ["kenia", "kenya", "nairobi"],
    location: loc("africa", "KEN", 0.5, 37.9),
    facts: [
      f("Lage", "in Ostafrika, am Indischen Ozean, am Äquator", "lage"),
      f("Hauptstadt", "Nairobi", "hauptstadt"),
      f("Einwohnerzahl", "rund 55 Millionen", "bevoelkerung"),
      f("Fläche", "580.367 km²", "flaeche"),
      f("Amtssprache", "Swahili und Englisch", "sprache"),
      f("Staatsform", "präsidentielle Republik", "regierung"),
      f("Währung", "Kenia-Schilling (KES)", "waehrung"),
    ],
  },
  {
    name: "Kanada",
    officialName: "Kanada",
    aliases: ["kanada", "canada", "ottawa"],
    location: loc("north-america", "CAN", 56.1, -106.3),
    facts: [
      f("Lage", "in Nordamerika, vom Atlantik bis zum Pazifik, nördlich der USA", "lage"),
      f("Hauptstadt", "Ottawa", "hauptstadt"),
      f("Einwohnerzahl", "rund 41 Millionen", "bevoelkerung"),
      f("Fläche", "9.984.670 km²", "flaeche"),
      f("Amtssprache", "Englisch und Französisch", "sprache"),
      f("Staatsform", "föderale parlamentarische Monarchie", "regierung"),
      f("Währung", "Kanadischer Dollar (CAD)", "waehrung"),
    ],
  },
  {
    name: "Ägypten",
    officialName: "Arabische Republik Ägypten",
    aliases: ["ägypten", "agypten", "egypt", "kairo", "cairo"],
    location: loc("africa", "EGY", 26.8, 30.8),
    facts: [
      f("Lage", "in Nordafrika und auf der Sinai-Halbinsel, am Mittelmeer und Roten Meer", "lage"),
      f("Hauptstadt", "Kairo", "hauptstadt"),
      f("Einwohnerzahl", "rund 106 Millionen", "bevoelkerung"),
      f("Fläche", "1.010.408 km²", "flaeche"),
      f("Amtssprache", "Arabisch", "sprache"),
      f("Staatsform", "semipräsidentielle Republik", "regierung"),
      f("Währung", "Ägyptisches Pfund (EGP)", "waehrung"),
    ],
  },
  {
    name: "Indien",
    officialName: "Republik Indien",
    aliases: ["indien", "india", "new delhi", "delhi"],
    location: loc("asia", "IND", 22.4, 79.0),
    facts: [
      f("Lage", "in Südasien, zwischen Arabischem Meer und Golf von Bengalen", "lage"),
      f("Hauptstadt", "New Delhi", "hauptstadt"),
      f("Einwohnerzahl", "rund 1,43 Milliarden", "bevoelkerung"),
      f("Fläche", "3.287.263 km²", "flaeche"),
      f("Amtssprache", "Hindi und Englisch (plus weitere anerkannte Sprachen)", "sprache"),
      f("Staatsform", "föderale parlamentarische Republik", "regierung"),
      f("Währung", "Indische Rupie (INR)", "waehrung"),
    ],
  },
  {
    name: "Australien",
    officialName: "Commonwealth of Australia",
    aliases: ["australien", "australia", "canberra"],
    location: loc("oceania", "AUS", -25.3, 133.8),
    facts: [
      f("Lage", "Kontinent und Inselstaat zwischen Indischem und Pazifischem Ozean", "lage"),
      f("Hauptstadt", "Canberra", "hauptstadt"),
      f("Einwohnerzahl", "rund 27 Millionen", "bevoelkerung"),
      f("Fläche", "7.688.287 km²", "flaeche"),
      f("Amtssprache", "Englisch (de facto)", "sprache"),
      f("Staatsform", "föderale parlamentarische Monarchie", "regierung"),
      f("Währung", "Australischer Dollar (AUD)", "waehrung"),
    ],
  },
  {
    name: "Norwegen",
    officialName: "Königreich Norwegen",
    aliases: ["norwegen", "norway", "oslo"],
    location: loc("europe", "NOR", 64.5, 11.0),
    facts: [
      f("Lage", "in Nordeuropa auf der Skandinavischen Halbinsel, an der Nordsee und dem Nordmeer", "lage"),
      f("Hauptstadt", "Oslo", "hauptstadt"),
      f("Einwohnerzahl", "rund 5,6 Millionen", "bevoelkerung"),
      f("Fläche", "385.207 km²", "flaeche"),
      f("Amtssprache", "Norwegisch (Bokmål und Nynorsk), dazu Samisch in Teilen des Landes", "sprache"),
      f("Staatsform", "konstitutionelle Monarchie", "regierung"),
      f("Währung", "Norwegische Krone (NOK)", "waehrung"),
    ],
  },
  {
    name: "Mexiko",
    officialName: "Vereinigte Mexikanische Staaten",
    aliases: ["mexiko", "mexico", "méxico", "ciudad de mexico", "mexico city"],
    location: loc("north-america", "MEX", 23.6, -102.5),
    facts: [
      f("Lage", "in Nordamerika, zwischen USA, Pazifik, Golf von Mexiko und Guatemala/Belize", "lage"),
      f("Hauptstadt", "Mexiko-Stadt", "hauptstadt"),
      f("Einwohnerzahl", "rund 130 Millionen", "bevoelkerung"),
      f("Fläche", "1.964.375 km²", "flaeche"),
      f("Amtssprache", "Spanisch (de facto), plus anerkannte indigene Sprachen", "sprache"),
      f("Staatsform", "föderale präsidentielle Republik", "regierung"),
      f("Währung", "Mexikanischer Peso (MXN)", "waehrung"),
    ],
  },
  {
    name: "Südafrika",
    officialName: "Republik Südafrika",
    aliases: ["südafrika", "sudafrica", "south africa", "pretoria", "kapstadt"],
    location: loc("africa", "ZAF", -29.0, 25.1),
    facts: [
      f("Lage", "an der Südspitze Afrikas, zwischen Atlantik und Indischem Ozean", "lage"),
      f("Hauptstadt", "Pretoria (Regierung), Kapstadt (Parlament), Bloemfontein (Justiz)", "hauptstadt"),
      f("Einwohnerzahl", "rund 63 Millionen", "bevoelkerung"),
      f("Fläche", "1.221.037 km²", "flaeche"),
      f("Amtssprache", "elf Amtssprachen, darunter isiZulu, isiXhosa, Afrikaans und Englisch", "sprache"),
      f("Staatsform", "parlamentarische Republik", "regierung"),
      f("Währung", "Südafrikanischer Rand (ZAR)", "waehrung"),
    ],
  },
  {
    name: "Italien",
    officialName: "Italienische Republik",
    aliases: ["italien", "italy", "italia", "rom", "rome"],
    location: loc("europe", "ITA", 42.8, 12.6),
    facts: [
      f("Lage", "in Südeuropa auf der Apenninhalbinsel, im Mittelmeer", "lage"),
      f("Hauptstadt", "Rom", "hauptstadt"),
      f("Einwohnerzahl", "rund 59 Millionen", "bevoelkerung"),
      f("Fläche", "302.073 km²", "flaeche"),
      f("Amtssprache", "Italienisch", "sprache"),
      f("Staatsform", "parlamentarische Republik", "regierung"),
      f("Währung", "Euro (EUR)", "waehrung"),
    ],
  },
  {
    name: "Polen",
    officialName: "Republik Polen",
    aliases: ["polen", "poland", "polska", "warschau", "warsaw"],
    location: loc("europe", "POL", 52.1, 19.4),
    facts: [
      f("Lage", "in Mitteleuropa, an der Ostsee, zwischen Deutschland und Belarus/Ukraine", "lage"),
      f("Hauptstadt", "Warschau", "hauptstadt"),
      f("Einwohnerzahl", "rund 36,6 Millionen", "bevoelkerung"),
      f("Fläche", "312.696 km²", "flaeche"),
      f("Amtssprache", "Polnisch", "sprache"),
      f("Staatsform", "parlamentarische Republik", "regierung"),
      f("Währung", "Złoty (PLN)", "waehrung"),
    ],
  },
  {
    name: "Spanien",
    officialName: "Königreich Spanien",
    aliases: ["spanien", "spain", "españa", "espana", "madrid"],
    location: loc("europe", "ESP", 40.4, -3.7),
    facts: [
      f("Lage", "auf der Iberischen Halbinsel in Südwesteuropa, plus Balearen und Kanaren", "lage"),
      f("Hauptstadt", "Madrid", "hauptstadt"),
      f("Einwohnerzahl", "rund 48 Millionen", "bevoelkerung"),
      f("Fläche", "505.990 km²", "flaeche"),
      f("Amtssprache", "Spanisch (Kastilisch); regional u. a. Katalanisch, Galicisch, Baskisch", "sprache"),
      f("Staatsform", "parlamentarische Monarchie", "regierung"),
      f("Währung", "Euro (EUR)", "waehrung"),
    ],
  },
  {
    name: "China",
    officialName: "Volksrepublik China",
    aliases: ["china", "volksrepublik china", "peking", "beijing"],
    location: loc("asia", "CHN", 35.9, 104.2),
    facts: [
      f("Lage", "in Ostasien, vom Pazifik bis nach Zentralasien", "lage"),
      f("Hauptstadt", "Peking", "hauptstadt"),
      f("Einwohnerzahl", "rund 1,41 Milliarden", "bevoelkerung"),
      f("Fläche", "9.596.961 km²", "flaeche"),
      f("Amtssprache", "Hochchinesisch (Mandarin)", "sprache"),
      f("Staatsform", "sozialistische Volksrepublik", "regierung"),
      f("Währung", "Renminbi Yuan (CNY)", "waehrung"),
    ],
  },
  {
    name: "Vereinigte Staaten",
    officialName: "Vereinigte Staaten von Amerika",
    aliases: [
      "usa",
      "united states",
      "vereinigte staaten",
      "amerika",
      "washington",
    ],
    location: loc("north-america", "USA", 39.8, -98.6),
    facts: [
      f("Lage", "in Nordamerika, zwischen Atlantik und Pazifik, plus Alaska und Hawaii", "lage"),
      f("Hauptstadt", "Washington, D.C.", "hauptstadt"),
      f("Einwohnerzahl", "rund 340 Millionen", "bevoelkerung"),
      f("Fläche", "9.833.520 km²", "flaeche"),
      f("Amtssprache", "Englisch (de facto auf Bundesebene)", "sprache"),
      f("Staatsform", "föderale präsidentielle Republik", "regierung"),
      f("Währung", "US-Dollar (USD)", "waehrung"),
    ],
  },
  {
    name: "Türkei",
    officialName: "Republik Türkei",
    aliases: ["türkei", "turkei", "turkey", "türkiye", "ankara"],
    location: loc("asia", "TUR", 39.0, 35.2),
    facts: [
      f("Lage", "zwischen Südosteuropa und Vorderasien, um Bosporus und Dardanellen", "lage"),
      f("Hauptstadt", "Ankara", "hauptstadt"),
      f("Einwohnerzahl", "rund 85 Millionen", "bevoelkerung"),
      f("Fläche", "783.562 km²", "flaeche"),
      f("Amtssprache", "Türkisch", "sprache"),
      f("Staatsform", "präsidentielle Republik", "regierung"),
      f("Währung", "Türkische Lira (TRY)", "waehrung"),
    ],
  },
  {
    name: "Argentinien",
    officialName: "Argentinische Republik",
    aliases: ["argentinien", "argentina", "buenos aires"],
    location: loc("south-america", "ARG", -35.0, -65.0),
    facts: [
      f("Lage", "im Süden Südamerikas, vom Gran Chaco bis Feuerland", "lage"),
      f("Hauptstadt", "Buenos Aires", "hauptstadt"),
      f("Einwohnerzahl", "rund 46 Millionen", "bevoelkerung"),
      f("Fläche", "2.780.400 km²", "flaeche"),
      f("Amtssprache", "Spanisch", "sprache"),
      f("Staatsform", "föderale präsidentielle Republik", "regierung"),
      f("Währung", "Argentinischer Peso (ARS)", "waehrung"),
    ],
  },
];

export const DEFAULT_PROFILE = COUNTRY_PROFILES[0];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function findCountryProfile(haystack: string): CountryProfile | null {
  const n = normalize(haystack);
  if (!n) return null;

  let best: { profile: CountryProfile; score: number } | null = null;
  for (const profile of COUNTRY_PROFILES) {
    const names = [profile.name, profile.officialName ?? "", ...profile.aliases];
    for (const alias of names) {
      const a = normalize(alias);
      if (!a) continue;
      if (n.includes(a) || a.includes(n)) {
        const score = a.length;
        if (!best || score > best.score) best = { profile, score };
      }
    }
  }
  return best?.profile ?? null;
}
