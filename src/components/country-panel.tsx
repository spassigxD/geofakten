"use client";

import Link from "next/link";
import {
  BookmarkCheck,
  ExternalLink,
  Globe2,
  Layers,
  MousePointerClick,
  RefreshCw,
  WifiOff,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { continentLabels } from "@/lib/geo";
import { cn } from "@/lib/utils";
import type { CountryDossier } from "@/lib/wikipedia";
import { type CountryMeta, kindLabels } from "@/lib/world";

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg bg-muted/70 px-3 py-2">
      <dt className="shrink-0 text-sm font-medium text-muted-foreground">
        {label}
      </dt>
      <dd className="text-right text-sm font-medium">{value}</dd>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted", className)} />;
}

export function CountryPanelEmpty({
  onPick,
  suggestions,
}: {
  onPick: (id: string) => void;
  suggestions: CountryMeta[];
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-5 py-10 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-primary">
        <MousePointerClick className="size-5" />
      </span>
      <h2 className="font-heading text-xl font-semibold">Land auswählen</h2>
      <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
        Tippe auf ein Land in der Karte oder suche danach. Die Fakten kommen
        live aus der deutschen Wikipedia.
      </p>
      {suggestions.length > 0 ? (
        <div className="mt-5 w-full">
          <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
            Zum Ausprobieren
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {suggestions.map((country) => (
              <Button
                key={country.id}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onPick(country.id)}
              >
                {country.name}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CountryPanel({
  meta,
  dossier,
  loading,
  savedDeckId,
  onRetry,
  onSaveCards,
  className,
}: {
  meta: CountryMeta;
  dossier: CountryDossier | null;
  loading: boolean;
  savedDeckId: string | null;
  onRetry: () => void;
  onSaveCards: () => void;
  className?: string;
}) {
  const offline = dossier?.source === "offline";
  const facts = dossier?.facts ?? [];

  return (
    <div className={cn("flex flex-col gap-4 px-4 pb-5", className)}>
      <div className="flex items-start gap-3">
        {dossier?.flagUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dossier.flagUrl}
            alt={`Flagge von ${meta.name}`}
            className="mt-0.5 h-8 w-12 shrink-0 rounded-sm object-cover ring-1 ring-foreground/15"
            loading="lazy"
          />
        ) : null}
        <div className="min-w-0">
          <h2 className="font-heading text-xl leading-tight font-semibold">
            {meta.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {dossier?.description ??
              meta.officialName ??
              (meta.continent
                ? `Gebiet in ${continentLabels[meta.continent]}`
                : meta.nameEn)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {meta.continent ? (
          <Badge variant="secondary">
            <Globe2 />
            {continentLabels[meta.continent]}
          </Badge>
        ) : null}
        {meta.kind !== "country" ? (
          <Badge variant="outline">{kindLabels[meta.kind]}</Badge>
        ) : null}
        {meta.iso2 ? <Badge variant="outline">{meta.iso2}</Badge> : null}
      </div>

      {offline ? (
        <Alert variant="destructive">
          <WifiOff />
          <AlertTitle>Wikipedia gerade nicht erreichbar</AlertTitle>
          <AlertDescription>
            Du siehst die im Browser gespeicherten Basisdaten. Sobald du wieder
            online bist, lädt der Abruf die aktuellen Zahlen nach.
          </AlertDescription>
        </Alert>
      ) : null}

      {loading && facts.length === 0 ? (
        <div className="space-y-2" aria-busy="true">
          <span className="sr-only">Fakten werden geladen…</span>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Skeleton key={index} className="h-11 w-full" />
          ))}
        </div>
      ) : facts.length > 0 ? (
        <dl className="space-y-1.5">
          {facts.map((fact) => (
            <FactRow
              key={`${fact.label}-${fact.value}`}
              label={fact.label}
              value={fact.value}
            />
          ))}
        </dl>
      ) : (
        <Alert>
          <WifiOff />
          <AlertTitle>Keine Fakten gefunden</AlertTitle>
          <AlertDescription>
            Für {meta.name} liefert Wikidata gerade keine strukturierten
            Angaben. Der Artikel hilft trotzdem weiter.
          </AlertDescription>
        </Alert>
      )}

      {dossier?.summary ? (
        <p className="text-sm leading-6 text-muted-foreground">
          {dossier.summary}
        </p>
      ) : loading ? (
        <Skeleton className="h-16 w-full" />
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="lg"
          className="h-10 px-4"
          onClick={onSaveCards}
          disabled={facts.length === 0}
        >
          <Layers />
          {savedDeckId ? "Nochmal als Karten" : "Als Karteikarten lernen"}
        </Button>
        {dossier?.articleUrl ? (
          <a
            href={dossier.articleUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-10 px-4"
            )}
          >
            <ExternalLink />
            Wikipedia
          </a>
        ) : null}
        {offline || (dossier?.partial && !loading) ? (
          <Button
            type="button"
            size="lg"
            variant="ghost"
            className="h-10 px-3"
            onClick={onRetry}
          >
            <RefreshCw className={cn(loading && "animate-spin")} />
            Neu laden
          </Button>
        ) : null}
      </div>

      {savedDeckId ? (
        <Alert>
          <BookmarkCheck />
          <AlertTitle>Karten gespeichert</AlertTitle>
          <AlertDescription>
            {meta.name} liegt jetzt in deiner{" "}
            <Link href="/bibliothek">Bibliothek</Link> – üben kannst du sie
            unter <Link href="/lernen">Lernen</Link>.
          </AlertDescription>
        </Alert>
      ) : null}

      <p className="text-xs leading-5 text-muted-foreground">
        Fakten: deutsche Wikipedia (CC BY-SA 4.0) und Wikidata (CC0). Karte:
        Natural Earth, gemeinfrei.
      </p>
    </div>
  );
}
