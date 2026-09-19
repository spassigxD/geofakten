"use client";

import type { ReactNode } from "react";
import { BookOpen, Camera, MapPinned } from "lucide-react";
import Link from "next/link";
import { StatsOverview } from "@/components/stats-overview";
import { UploadPanel } from "@/components/upload-panel";
import { buttonVariants } from "@/components/ui/button";
import { dueCount } from "@/lib/repetition";
import { useHydrated, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function LoadingBlock() {
  return (
    <div className="space-y-3" aria-busy="true">
      <div className="h-40 animate-pulse rounded-3xl bg-muted" />
      <p className="text-sm text-muted-foreground">Karten werden geladen…</p>
    </div>
  );
}

export function HomeView() {
  const hydrated = useHydrated();
  const { cards } = useStore();
  const due = dueCount(cards);

  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <p className="text-xs font-medium tracking-[0.22em] text-primary uppercase">
            Geografie auf Karteikarten
          </p>
          <h1 className="font-heading mt-3 max-w-xl text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl">
            Aus einem Foto wird eine lernbare Landkarte.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            Fotografiere eine Infobox – zum Beispiel die bolivarische Republik
            Venezuela auf Wikipedia – und übe Hauptstadt, Lage, Einwohner,
            Fläche und Staatsform. Nach jeder Antwort sortierst du die Karte in
            Nochmal lernen, Gut können oder Sehr gut können.
          </p>
        </div>
        <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <Step
            icon={<Camera className="size-4" />}
            title="Foto hochladen"
            text="Infobox, Atlas oder Heftseite."
          />
          <Step
            icon={<MapPinned className="size-4" />}
            title="Fakten prüfen"
            text="Die wichtigsten Angaben werden Karten."
          />
          <Step
            icon={<BookOpen className="size-4" />}
            title="Bewerten"
            text="Schwache Karten kommen häufiger wieder."
          />
        </ol>
      </section>

      <UploadPanel />

      {!hydrated ? (
        <LoadingBlock />
      ) : cards.length > 0 ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-2xl font-semibold">Dein Stand</h2>
              <p className="text-sm text-muted-foreground">
                {cards.length} Karten in der Bibliothek
                {due > 0 ? ` · ${due} fällig` : ""}.
              </p>
            </div>
            <Link
              href="/lernen"
              className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}
            >
              {due > 0 ? "Fällige Karten lernen" : "Trotzdem üben"}
            </Link>
          </div>
          <StatsOverview cards={cards} />
        </section>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Noch keine Karten. Der erste Upload oder das Venezuela-Beispiel füllt
          die Bibliothek.
        </p>
      )}
    </div>
  );
}

function Step({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <li className="flex gap-3 rounded-2xl border bg-card/70 px-4 py-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
        {icon}
      </span>
      <span>
        <span className="block font-medium">{title}</span>
        <span className="text-sm text-muted-foreground">{text}</span>
      </span>
    </li>
  );
}
