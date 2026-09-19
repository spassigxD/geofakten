"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Compass, Expand, Loader2, Minimize2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import {
  ContinentStudyBar,
  ContinentStudyDialog,
} from "@/components/continent-study";
import { CountryPanel, CountryPanelEmpty } from "@/components/country-panel";
import { CountrySearch } from "@/components/country-search";
import { MAP_FRAME_HEIGHT, WorldMap } from "@/components/world-map";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { upsertCountryFacts, useStore } from "@/lib/store";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
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
import type { ContinentId, Fact } from "@/lib/types";

const SUGGESTION_IDS = ["DEU", "JPN", "BRA", "NAM", "ISL", "TUV"];

const COUNTRY_TOTAL = WORLD_COUNTRIES.filter(
  (country) => country.kind === "country"
).length;

/** Guards against a slow lookup overwriting a newer selection. */
let requestToken = 0;

function MapFallback({
  error,
  onRetry,
  className,
}: {
  error: string | null;
  onRetry: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center rounded-3xl bg-muted/70 ring-1 ring-foreground/10",
        className ?? MAP_FRAME_HEIGHT
      )}
    >
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
  const [focusContinent, setFocusContinent] = useState<ContinentId | null>(null);
  const [continentDialog, setContinentDialog] = useState<ContinentId | null>(
    null
  );
  const [fullscreen, setFullscreen] = useState(false);

  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const sheetBodyRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const { decks } = useStore();

  const selected = countryById(selectedId);
  const mapFrameClass = fullscreen
    ? "h-full min-h-[14rem] rounded-2xl"
    : undefined;

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
        setFocusContinent(null);
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

  const exitFullscreen = useCallback(async () => {
    setFullscreen(false);
    document.body.style.overflow = "";
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined);
    }
  }, []);

  const enterFullscreen = useCallback(async () => {
    setFullscreen(true);
    document.body.style.overflow = "hidden";
    try {
      await shellRef.current?.requestFullscreen?.();
    } catch {
      // App overlay still covers the viewport if the browser blocks the API.
    }
  }, []);

  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) {
        setFullscreen(false);
        document.body.style.overflow = "";
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (fullscreen) {
        event.preventDefault();
        void exitFullscreen();
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [exitFullscreen, fullscreen]);

  useEffect(() => {
    let active = true;
    loadWorldCollection()
      .then((data) => {
        if (!active) return;
        setCollection(data);
        setMapError(null);
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
          deck.source === "wikipedia" &&
          (deck.countryId === selected.id || deck.countryName === selected.name)
      ) ?? null)
    : null;

  const saveCards = (facts: Fact[]) => {
    if (!selected || facts.length === 0) return;
    const { added } = upsertCountryFacts(
      {
        source: "wikipedia",
        usedFallback: dossier?.source === "offline",
        countryName: selected.name,
        officialName: selected.officialName ?? dossier?.officialName,
        countryId: selected.id,
        facts,
        cards: [],
      },
      facts
    );
    toast.success(
      added === 0
        ? `${selected.name}: diese Fakten sind schon in der Bibliothek.`
        : `${selected.name}: ${added} ${added === 1 ? "Karte" : "Karten"} gespeichert.`
    );
  };

  const pickContinent = (continent: ContinentId) => {
    setFocusContinent(continent);
    setFocusNonce((nonce) => nonce + 1);
    setContinentDialog(continent);
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

  const fullscreenButton = (
    <Button
      type="button"
      size={fullscreen ? "lg" : "sm"}
      variant={fullscreen ? "default" : "outline"}
      className={fullscreen ? "h-10 px-4" : "h-9 px-3"}
      onClick={() => (fullscreen ? void exitFullscreen() : void enterFullscreen())}
      aria-pressed={fullscreen}
    >
      {fullscreen ? <Minimize2 /> : <Expand />}
      {fullscreen ? "Vollbild beenden" : "Vollbild"}
    </Button>
  );

  return (
    <div
      ref={shellRef}
      className={cn(
        fullscreen
          ? "fixed inset-0 z-[70] flex flex-col bg-background p-3 sm:p-4"
          : "space-y-6"
      )}
    >
      {fullscreen ? (
        <div className="flex shrink-0 items-center justify-between gap-3 pb-2">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-[0.22em] text-primary uppercase">
              Weltkarte
            </p>
            <h1 className="font-heading truncate text-xl font-semibold">
              {selected?.name ?? "Jedes Land antippen"}
            </h1>
          </div>
          {fullscreenButton}
        </div>
      ) : (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-medium tracking-[0.22em] text-primary uppercase">
              Weltkarte
            </p>
            <h1 className="font-heading mt-2 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              Jedes Land antippen, Fakten sofort lesen.
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              {COUNTRY_TOTAL} Staaten und ihre Außengebiete auf einer Karte –
              live aus der deutschen Wikipedia. Zoome tief genug hinein, um auch
              Monaco, Nauru oder Tuvalu zu treffen. Oder lerne gleich einen
              ganzen Kontinent als Stapel.
            </p>
          </div>
          {fullscreenButton}
        </header>
      )}

      <div
        className={cn(
          "grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start",
          fullscreen && "min-h-0 flex-1 xl:items-stretch"
        )}
      >
        <div className={cn("space-y-3", fullscreen && "flex min-h-0 flex-col")}>
          <CountrySearch onSelect={(id) => select(id, true)} />
          {collection ? (
            <WorldMap
              collection={collection}
              selectedId={selectedId}
              onSelect={(id) => select(id, false)}
              onRandom={() => select(randomCountry(selectedId).id, true)}
              focusNonce={focusNonce}
              focusContinent={focusContinent}
              highlightContinent={continentDialog}
              className={fullscreen ? "min-h-0 flex-1" : undefined}
              frameClassName={mapFrameClass}
            />
          ) : (
            <MapFallback
              error={mapError}
              className={mapFrameClass}
              onRetry={() => {
                setMapError(null);
                setMapAttempt((attempt) => attempt + 1);
              }}
            />
          )}
          {!fullscreen ? (
            <p className="text-xs leading-5 text-muted-foreground">
              Tastatur: Pfeiltasten verschieben die Karte, <kbd>+</kbd> und{" "}
              <kbd>−</kbd> zoomen, <kbd>0</kbd> zeigt wieder die ganze Welt,{" "}
              <kbd>Esc</kbd> beendet das Vollbild. Kleinststaaten sind zusätzlich
              als Punkt markiert.
            </p>
          ) : null}
          <ContinentStudyBar
            active={continentDialog}
            onPick={pickContinent}
          />
        </div>

        <aside
          className={cn(
            "hidden overflow-y-auto rounded-2xl bg-card py-4 ring-1 ring-foreground/10 xl:block",
            fullscreen
              ? "max-h-none min-h-0"
              : "max-h-[calc(100dvh-7rem)] xl:sticky xl:top-24"
          )}
        >
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
        <SheetContent
          side="bottom"
          initialFocus={sheetBodyRef}
          className={cn("xl:hidden", fullscreen && "z-[80]")}
        >
          {selected ? (
            <>
              <SheetHeader className="sr-only">
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>
                  Fakten zu {selected.name} aus der deutschen Wikipedia.
                </SheetDescription>
              </SheetHeader>
              <div
                ref={sheetBodyRef}
                tabIndex={-1}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-4 outline-none"
              >
                {panel}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {!selected && !fullscreen ? (
        <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground ring-1 ring-foreground/10 xl:hidden">
          <Compass className="size-4 shrink-0 text-primary" />
          Tippe ein Land an – die Fakten öffnen sich als Karte von unten.
        </div>
      ) : null}

      <ContinentStudyDialog
        continent={continentDialog}
        open={Boolean(continentDialog)}
        onOpenChange={(open) => {
          if (!open) setContinentDialog(null);
        }}
      />
    </div>
  );
}
