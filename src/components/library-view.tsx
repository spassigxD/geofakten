"use client";

import { EmptyState } from "@/components/empty-state";
import { MasteryBadge } from "@/components/mastery-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { categoryLabels } from "@/lib/labels";
import { clearAll, deleteCard, deleteDeck, useHydrated, useStore } from "@/lib/store";
import type { Flashcard, Mastery } from "@/lib/types";
import { Library, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Filter = "all" | Mastery;

export function LibraryView() {
  const hydrated = useHydrated();
  const { cards, decks } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((card) => {
      if (filter !== "all" && card.mastery !== filter) return false;
      if (!q) return true;
      return (
        card.countryName.toLowerCase().includes(q) ||
        card.question.toLowerCase().includes(q) ||
        card.answer.toLowerCase().includes(q)
      );
    });
  }, [cards, filter, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Flashcard[]>();
    for (const card of visible) {
      const list = map.get(card.deckId) ?? [];
      list.push(card);
      map.set(card.deckId, list);
    }
    return [...map.entries()];
  }, [visible]);

  if (!hydrated) {
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="h-10 animate-pulse rounded-lg bg-muted" />
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        <p className="text-sm text-muted-foreground">Bibliothek wird geladen…</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <EmptyState
        icon={<Library className="size-5" />}
        title="Die Bibliothek ist leer"
        description="Noch keine Karteikarten. Lade ein Foto einer Infobox hoch oder nimm das Beispiel Venezuela – danach erscheinen die Karten hier, sortiert nach Lernstand."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as Filter)}
        >
          <TabsList className="h-auto max-w-full flex-wrap justify-start">
            <TabsTrigger value="all">Alle ({cards.length})</TabsTrigger>
            <TabsTrigger value="learn">
              Nochmal ({cards.filter((c) => c.mastery === "learn").length})
            </TabsTrigger>
            <TabsTrigger value="good">
              Gut ({cards.filter((c) => c.mastery === "good").length})
            </TabsTrigger>
            <TabsTrigger value="mastered">
              Sehr gut ({cards.filter((c) => c.mastery === "mastered").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Land oder Frage suchen"
            className="h-9 min-w-48"
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => {
              clearAll();
              toast.success("Bibliothek geleert.");
            }}
          >
            Alles löschen
          </Button>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/60 px-6 py-12 text-center text-sm text-muted-foreground">
          Keine Karten passen zu diesem Filter.
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([deckId, deckCards]) => {
            const deck = decks.find((item) => item.id === deckId);
            const title = deck?.countryName ?? deckCards[0]?.countryName;
            return (
              <section key={deckId} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {deck?.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={deck.thumbnail}
                        alt=""
                        className="size-12 rounded-lg object-cover ring-1 ring-foreground/10"
                      />
                    ) : null}
                    <div>
                      <h2 className="font-heading text-xl font-semibold">{title}</h2>
                      <p className="text-sm text-muted-foreground">
                        {deck?.officialName ? `${deck.officialName} · ` : ""}
                        {deckCards.length}{" "}
                        {deckCards.length === 1 ? "Karte" : "Karten"}
                        {deck?.source === "mock" ? " · Demo-Auswertung" : ""}
                        {deck?.source === "wikipedia" ? " · Weltkarte" : ""}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${title} löschen`}
                    onClick={() => {
                      deleteDeck(deckId);
                      toast.success(`${title} entfernt.`);
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {deckCards.map((card) => (
                    <Card key={card.id} size="sm">
                      <CardHeader>
                        <CardTitle className="flex items-start justify-between gap-2">
                          <span>{card.question}</span>
                          <MasteryBadge mastery={card.mastery} />
                        </CardTitle>
                        <CardDescription>
                          {categoryLabels[card.category]}
                          {card.reviewCount
                            ? ` · ${card.reviewCount}× wiederholt`
                            : " · noch nicht gelernt"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex items-end justify-between gap-3">
                        <p className="text-sm leading-6">{card.answer}</p>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Karte löschen"
                          onClick={() => deleteCard(card.id)}
                        >
                          <Trash2 />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
