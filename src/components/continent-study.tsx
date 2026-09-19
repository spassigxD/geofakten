"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Loader2 } from "lucide-react";
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

export function ContinentStudyBar({
  active,
  onPick,
}: {
  active: ContinentId | null;
  onPick: (continent: ContinentId) => void;
}) {
  return (
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
              onClick={() => onPick(continent)}
            >
              {continentLabels[continent]}
              <span className="text-xs opacity-70">({count})</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export function ContinentStudyDialog({
  continent,
  open,
  onOpenChange,
}: {
  continent: ContinentId | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open && Boolean(continent)} onOpenChange={onOpenChange}>
      {continent ? (
        <ContinentStudyForm
          key={continent}
          continent={continent}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  );
}

function ContinentStudyForm({
  continent,
  onOpenChange,
}: {
  continent: ContinentId;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const countryIds = countryIdsOnContinent(continent);
  const [name, setName] = useState(continentStackName(continent, defaultStudyCategories()));
  const [categories, setCategories] = useState<FactCategory[]>(
    defaultStudyCategories()
  );
  const [busy, setBusy] = useState(false);
  const title = continentLabels[continent];

  return (
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title} als Lernstapel</DialogTitle>
          <DialogDescription>
            {countryIds.length} Staaten. Wähle, welche Fakten in den Stapel
            kommen – die Karten landen in der Bibliothek und du kannst den
            Stapel später umbenennen oder Länder ergänzen.
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
            {busy ? <Loader2 className="animate-spin" /> : <Layers />}
            Stapel anlegen und lernen
          </Button>
        </DialogFooter>
      </DialogContent>
  );
}
