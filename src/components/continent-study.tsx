"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, Layers, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { CategoryToggles } from "@/components/fact-toggles";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { continentLabels } from "@/lib/geo";
import { createStudySet } from "@/lib/store";
import {
  CONTINENT_ORDER,
  continentStackName,
  countryIdsOnContinent,
  defaultStudyCategories,
  STUDY_CATEGORIES,
} from "@/lib/study";
import type { ContinentId, FactCategory } from "@/lib/types";
import { countriesOnContinent } from "@/lib/world";

export type ContinentStackMode = "facts" | "flags";

export function ContinentStudyBar({
  active,
  onPick,
}: {
  active: ContinentId | null;
  onPick: (continent: ContinentId, mode: ContinentStackMode) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Kontinent als Stapel lernen
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CONTINENT_ORDER.map((continent) => {
            const count = countriesOnContinent(continent).length;
            return (
              <Button
                key={continent}
                type="button"
                size="sm"
                variant={active === continent ? "default" : "outline"}
                onClick={() => onPick(continent, "facts")}
              >
                {continentLabels[continent]}
                <span className="text-xs opacity-70">({count})</span>
              </Button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Flaggen lernen
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CONTINENT_ORDER.map((continent) => (
            <Button
              key={`flag-${continent}`}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onPick(continent, "flags")}
            >
              <Flag />
              {continentLabels[continent]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ContinentStudyDialog({
  continent,
  mode,
  open,
  onOpenChange,
}: {
  continent: ContinentId | null;
  mode: ContinentStackMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open && Boolean(continent)} onOpenChange={onOpenChange}>
      {continent ? (
        <ContinentStudyForm
          key={`${continent}-${mode}`}
          continent={continent}
          mode={mode}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  );
}

function ContinentStudyForm({
  continent,
  mode,
  onOpenChange,
}: {
  continent: ContinentId;
  mode: ContinentStackMode;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const countryIds = countryIdsOnContinent(continent);
  const flags = mode === "flags";
  const initialCategories: FactCategory[] = flags
    ? ["flagge"]
    : defaultStudyCategories();
  const [name, setName] = useState(
    continentStackName(continent, initialCategories)
  );
  const [categories, setCategories] = useState<FactCategory[]>(initialCategories);
  const [busy, setBusy] = useState(false);
  const title = continentLabels[continent];

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>
          {flags ? `Flaggen von ${title}` : `${title} als Lernstapel`}
        </DialogTitle>
        <DialogDescription>
          {countryIds.length} Staaten.
          {flags
            ? " Jede Flagge wird in beide Richtungen geübt: Flagge → Land und Land → Flagge. Länder kannst du später in der Bibliothek ergänzen oder streichen."
            : " Wähle, welche Fakten in den Stapel kommen – die Karten landen in der Bibliothek und du kannst den Stapel später umbenennen oder Länder ergänzen."}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="continent-stack-name">
            Name
          </label>
          <Input
            id="continent-stack-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        {flags ? (
          <p className="rounded-xl bg-muted/70 px-3 py-2 text-sm text-muted-foreground">
            Stapel-Art: Flaggen. In der Bibliothek kannst du einzelne Länder
            hinzufügen oder entfernen.
          </p>
        ) : (
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Faktenarten</p>
            <CategoryToggles
              categories={STUDY_CATEGORIES}
              selected={categories}
              onChange={setCategories}
            />
            {categories.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Mindestens eine Faktenart wählen.
              </p>
            ) : null}
          </div>
        )}
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Abbrechen
        </Button>
        <Button
          type="button"
          disabled={categories.length === 0 || busy}
          onClick={() => {
            if (categories.length === 0) return;
            setBusy(true);
            try {
              const set = createStudySet({
                name:
                  name.trim() || continentStackName(continent, categories),
                continent,
                countryIds,
                categories,
              });
              toast.success(`${set.name} angelegt.`);
              onOpenChange(false);
              router.push(`/lernen?stapel=${set.id}`);
            } catch (error) {
              setBusy(false);
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Stapel konnte nicht angelegt werden."
              );
            }
          }}
        >
          {busy ? <Loader2 className="animate-spin" /> : flags ? <Flag /> : <Layers />}
          Stapel anlegen und lernen
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
