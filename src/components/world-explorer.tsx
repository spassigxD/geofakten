"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Compass, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { CountryPanel, CountryPanelEmpty } from "@/components/country-panel";
import { CountrySearch } from "@/components/country-search";
import { WorldMap } from "@/components/world-map";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { addExtracted, useStore } from "@/lib/store";
import { useMediaQuery } from "@/lib/use-media-query";
import {
  type CountryDossier,
  cachedDossier,
  getCountryDossier,
  offlineDossier,
} from "@/lib/wikipedia";
import {
  type CountryMeta,
  type WorldCollection,
  WORLD_COUNTRIES,
  countryById,
  loadWorldCollection,
  randomCountry,
} from "@/lib/world";

const SUGGESTION_IDS = ["DEU", "JPN", "BRA", "NAM", "ISL", "TUV"];

const COUNTRY_TOTAL = WORLD_COUNTRIES.filter(
  (country) => country.kind === "country"
).length;

/** Guards against a slow lookup overwriting a newer selection. */
let requestToken = 0;

function MapFallback({
  error,
  onRetry,
}: {
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="flex aspect-[1000/509] w-full items-center justify-center rounded-3xl bg-muted/70 ring-1 ring-foreground/10">
      {error ? (
        <div className="max-w-sm px-6 text-center">
          <Alert variant="destructive" className="text-left">
            <AlertCircle />
            <AlertTitle>Karte konnte nicht geladen werden</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button className="mt-3 h-10 px-4" size="lg" onClick={onRetry}>
            <RefreshCw />
            Erneut versuchen
          </Button>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Weltkarte wird geladen…
        </p>
      )}
    </div>
  );
}

export function WorldExplorer() {
  const [collection, setCollection] = useState<WorldCollection | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapAttempt, setMapAttempt] = useState(0);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dossier, setDossier] = useState<CountryDossier | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusNonce, setFocusNonce] = useState(0);

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { decks } = useStore();

  const selected = countryById(selectedId);

  const load = useCallback((country: CountryMeta, refresh = false) => {
    const token = ++requestToken;
    const cached = refresh ? null : cachedDossier(country);
    if (cached) {
      setDossier(cached);
      setLoading(false);
      return;
    }
    setDossier(null);
    setLoading(true);
    getCountryDossier(country, { refresh })
      .catch(() => offlineDossier(country))
      .then((result) => {
        if (token !== requestToken) return;
        setDossier(result);
        setLoading(false);
      });
  }, []);

  const select = useCallback(
    (id: string | null, recentre = false) => {
      const country = countryById(id);
      setSelectedId(country ? country.id : null);
      if (country) {
        if (recentre) setFocusNonce((nonce) => nonce + 1);
        load(country);
      } else {
        requestToken += 1;
        setDossier(null);
        setLoading(false);
      }
    },
    [load]
  );

  useEffect(() => {
    let active = true;
    loadWorldCollection()
      .then((data) => {
        if (!active) return;
        setCollection(data);
        setMapError(null);
        // Deep links such as /weltkarte#TUV open straight on that country.
        const fromHash = window.location.hash.replace("#", "").toUpperCase();
        if (countryById(fromHash)) select(fromHash, true);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMapError(
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler beim Laden der Kartendaten."
        );
      });
    return () => {
      active = false;
    };
  }, [mapAttempt, select]);

  useEffect(() => {
    const { pathname, search } = window.location;
    window.history.replaceState(
      null,
      "",
      selectedId ? `#${selectedId}` : `${pathname}${search}`
    );
  }, [selectedId]);

  const suggestions = useMemo(
    () =>
      SUGGESTION_IDS.map((id) => countryById(id)).filter(
        (country): country is CountryMeta => country !== null
      ),
    []
  );

  const savedDeck = selected
    ? (decks.find(
        (deck) =>
          deck.source === "wikipedia" && deck.countryName === selected.name
      ) ?? null)
    : null;

  const saveCards = () => {
    if (!selected || !dossier || dossier.facts.length === 0) return;
    addExtracted({
      source: "wikipedia",
      usedFallback: dossier.source === "offline",
      countryName: selected.name,
      officialName: selected.officialName ?? dossier.officialName,
      facts: dossier.facts,
      cards: [],
    });
    toast.success(`${selected.name} als Karteikarten gespeichert.`);
  };

  const panel = selected ? (
    <CountryPanel
      meta={selected}
      dossier={dossier}
      loading={loading}
      savedDeckId={savedDeck?.id ?? null}
      onRetry={() => load(selected, true)}
      onSaveCards={saveCards}
    />
  ) : null;

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <p className="text-xs font-medium tracking-[0.22em] text-primary uppercase">
          Weltkarte
        </p>
        <h1 className="font-heading mt-3 text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl">
          Jedes Land antippen, Fakten sofort lesen.
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          {COUNTRY_TOTAL} Staaten und ihre Außengebiete auf einer Karte. Ein
          Klick zeigt Hauptstadt, Einwohnerzahl, Fläche, Sprachen, Staatsform
          und Währung – live aus der deutschen Wikipedia geladen. Zoome tief
          genug hinein, um auch Monaco, Nauru oder Tuvalu zu treffen.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start">
        <div className="space-y-3">
          <CountrySearch onSelect={(id) => select(id, true)} />
          {collection ? (
            <WorldMap
              collection={collection}
              selectedId={selectedId}
              onSelect={(id) => select(id, false)}
              onRandom={() => select(randomCountry(selectedId).id, true)}
              focusNonce={focusNonce}
            />
          ) : (
            <MapFallback
              error={mapError}
              onRetry={() => {
                setMapError(null);
                setMapAttempt((attempt) => attempt + 1);
              }}
            />
          )}
          <p className="text-xs leading-5 text-muted-foreground">
            Tastatur: Pfeiltasten verschieben die Karte, <kbd>+</kbd> und{" "}
            <kbd>−</kbd> zoomen, <kbd>0</kbd> zeigt wieder die ganze Welt.
            Kleinststaaten sind zusätzlich als Punkt markiert.
          </p>
        </div>

        <aside className="hidden max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-2xl bg-card py-4 ring-1 ring-foreground/10 lg:sticky lg:top-24 lg:block">
          {panel ?? (
            <CountryPanelEmpty
              suggestions={suggestions}
              onPick={(id) => select(id, true)}
            />
          )}
        </aside>
      </div>

      <Sheet
        open={!isDesktop && Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) select(null);
        }}
      >
        <SheetContent side="bottom" className="lg:hidden">
          {selected ? (
            <>
              <SheetHeader className="sr-only">
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>
                  Fakten zu {selected.name} aus der deutschen Wikipedia.
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 overflow-y-auto overscroll-contain pt-4">
                {panel}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {!selected ? (
        <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground ring-1 ring-foreground/10 lg:hidden">
          <Compass className="size-4 shrink-0 text-primary" />
          Tippe ein Land an – die Fakten öffnen sich als Karte von unten.
        </div>
      ) : null}
    </div>
  );
}
