"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/empty-state";
import { MasteryBadge } from "@/components/mastery-badge";
import { categoryLabels, ratingLabels } from "@/lib/labels";
import { pickSession } from "@/lib/repetition";
import { rateCard, useHydrated, useStore } from "@/lib/store";
import type { Flashcard, Rating } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Library, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

export function StudySession() {
  const hydrated = useHydrated();
  const { cards, decks } = useStore();
  const [queue, setQueue] = useState<Flashcard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [done, setDone] = useState(false);

  const liveQueue = useMemo(() => {
    if (!queue) return [];
    return queue.map((card) => cards.find((item) => item.id === card.id) ?? card);
  }, [cards, queue]);

  const card = liveQueue[index];
  const deck = card ? decks.find((item) => item.id === card.deckId) : undefined;
  const progress =
    liveQueue.length === 0 ? 0 : Math.round((index / liveQueue.length) * 100);

  const startRound = useCallback(() => {
    setQueue(pickSession(cards));
    setIndex(0);
    setFlipped(false);
    setRatings([]);
    setDone(false);
  }, [cards]);

  if (hydrated && queue === null && cards.length > 0) {
    setQueue(pickSession(cards));
  }

  const rate = useCallback(
    (rating: Rating) => {
      if (!flipped || !card || done) return;
      rateCard(card.id, rating);
      setRatings((current) => [...current, rating]);
      setFlipped(false);
      const next = index + 1;
      if (next >= liveQueue.length) setDone(true);
      else setIndex(next);
    },
    [card, done, flipped, index, liveQueue.length]
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (done || !card) return;
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        setFlipped(true);
      }
      if (!flipped) return;
      if (event.key === "1") rate(1);
      if (event.key === "2") rate(2);
      if (event.key === "3") rate(3);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, done, flipped, rate]);

  if (!hydrated) {
    return (
      <div className="rounded-2xl border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
        Sitzung wird vorbereitet…
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <EmptyState
        icon={<Library className="size-5" />}
        title="Noch nichts zu lernen"
        description="Lade zuerst ein Foto einer Infobox oder Schulbuchseite hoch. Daraus entstehen Karten für die nächste Sitzung."
      />
    );
  }

  if (queue === null) {
    return (
      <div className="rounded-2xl border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
        Sitzung wird vorbereitet…
      </div>
    );
  }

  if (done || !card) {
    const again = ratings.filter((value) => value === 1).length;
    const good = ratings.filter((value) => value === 2).length;
    const great = ratings.filter((value) => value === 3).length;
    return (
      <div className="mx-auto max-w-xl rounded-3xl border bg-card px-6 py-12 text-center">
        <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
          Sitzung beendet
        </p>
        <h1 className="font-heading mt-2 text-3xl font-semibold">
          {ratings.length === 0 ? "Keine Karten in dieser Runde" : "Guter Durchgang"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Karten, die du mit „Nochmal lernen“ bewertet hast, kommen als Nächstes
          wieder. Die anderen rücken weiter nach hinten.
        </p>
        <dl className="mt-8 grid grid-cols-3 gap-3 text-sm">
          <Stat label={ratingLabels[1]} value={again} />
          <Stat label={ratingLabels[2]} value={good} />
          <Stat label={ratingLabels[3]} value={great} />
        </dl>
        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Button size="lg" className="h-11 px-4" onClick={startRound}>
            <RotateCcw />
            Noch eine Runde
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Karte {index + 1} von {liveQueue.length}
          </span>
          <MasteryBadge mastery={card.mastery} />
        </div>
        <Progress value={progress} />
      </div>

      <button
        type="button"
        onClick={() => setFlipped(true)}
        className="w-full text-left [perspective:1400px]"
      >
        <div
          className={cn(
            "relative min-h-[320px] w-full transition-transform duration-500 [transform-style:preserve-3d] sm:min-h-[380px]",
            flipped && "[transform:rotateY(180deg)]"
          )}
        >
          <article className="absolute inset-0 rounded-3xl border bg-card p-6 shadow-sm [backface-visibility:hidden] sm:p-8">
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              {card.countryName} · {categoryLabels[card.category]}
            </p>
            <h2 className="font-heading mt-8 text-2xl leading-snug font-semibold sm:text-3xl">
              {card.question}
            </h2>
            <p className="absolute right-6 bottom-6 text-sm text-muted-foreground">
              Tippen oder Leertaste: Antwort zeigen
            </p>
          </article>
          <article className="absolute inset-0 rounded-3xl border bg-[oklch(0.97_0.02_92)] p-6 shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-8">
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Antwort
            </p>
            <p className="font-heading mt-6 text-2xl leading-snug font-semibold sm:text-3xl">
              {card.answer}
            </p>
            {card.extraHint ? (
              <p className="mt-6 text-sm leading-6 text-muted-foreground">
                {card.extraHint}
              </p>
            ) : null}
            {deck?.officialName ? (
              <p className="mt-4 text-xs text-muted-foreground">
                {deck.officialName}
              </p>
            ) : null}
          </article>
        </div>
      </button>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button
          size="lg"
          variant="outline"
          className="h-12 border-[oklch(0.82_0.06_50)] bg-[oklch(0.97_0.03_55)] text-[oklch(0.42_0.12_45)]"
          disabled={!flipped}
          onClick={() => rate(1)}
        >
          {ratingLabels[1]}
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-12"
          disabled={!flipped}
          onClick={() => rate(2)}
        >
          {ratingLabels[2]}
        </Button>
        <Button
          size="lg"
          className="h-12"
          disabled={!flipped}
          onClick={() => rate(3)}
        >
          {ratingLabels[3]}
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Tasten 1 / 2 / 3 bewerten die Karte, sobald die Antwort sichtbar ist.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted px-3 py-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-heading mt-1 text-2xl font-semibold tabular-nums">
        {value}
      </dd>
    </div>
  );
}
