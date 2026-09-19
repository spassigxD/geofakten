"use client";

import { Button } from "@/components/ui/button";
import { categoryLabels } from "@/lib/labels";
import type { Fact, FactCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CategoryToggles({
  categories,
  selected,
  onChange,
  counts,
}: {
  categories: FactCategory[];
  selected: FactCategory[];
  onChange: (next: FactCategory[]) => void;
  counts?: Partial<Record<FactCategory, number>>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Faktenarten">
      {categories.map((category) => {
        const on = selected.includes(category);
        const count = counts?.[category];
        return (
          <Button
            key={category}
            type="button"
            size="sm"
            variant={on ? "default" : "outline"}
            aria-pressed={on}
            onClick={() =>
              onChange(
                on
                  ? selected.filter((item) => item !== category)
                  : [...selected, category]
              )
            }
          >
            {categoryLabels[category]}
            {typeof count === "number" ? ` (${count})` : ""}
          </Button>
        );
      })}
    </div>
  );
}

export function FactToggles({
  facts,
  selected,
  onChange,
}: {
  facts: Fact[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="space-y-1.5" role="group" aria-label="Fakten für Karteikarten">
      {facts.map((fact) => {
        const on = selected.includes(fact.label);
        return (
          <button
            key={fact.label}
            type="button"
            aria-pressed={on}
            onClick={() =>
              onChange(
                on
                  ? selected.filter((item) => item !== fact.label)
                  : [...selected, fact.label]
              )
            }
            className={cn(
              "flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left ring-1 transition-colors",
              on
                ? "bg-primary/8 ring-primary/30"
                : "bg-muted/40 ring-transparent hover:bg-muted/70"
            )}
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium text-muted-foreground">
                {fact.label}
              </span>
              <span className="block text-sm font-medium">{fact.value}</span>
            </span>
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
                on
                  ? "bg-primary text-primary-foreground"
                  : "bg-background ring-1 ring-foreground/15 text-muted-foreground"
              )}
              aria-hidden
            >
              {on ? "✓" : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
