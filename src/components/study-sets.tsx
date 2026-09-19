"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CountrySearch } from "@/components/country-search";
import { EmptyState } from "@/components/empty-state";
import { CategoryToggles } from "@/components/fact-toggles";
import { Button, buttonVariants } from "@/components/ui/button";
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
import {
  createStudySet,
  deleteStudySet,
  setActiveStudySet,
  updateStudySet,
  useHydrated,
  useStore,
} from "@/lib/store";
import {
  ALL_FACT_CATEGORIES,
  defaultStudyCategories,
  STUDY_CATEGORIES,
  studySetSummary,
} from "@/lib/study";
import type { FactCategory, StudySet } from "@/lib/types";
import { cn } from "@/lib/utils";
import { countryById } from "@/lib/world";

export function StudySetList({
  allowCreate = true,
}: {
  allowCreate?: boolean;
}) {
  const hydrated = useHydrated();
  const { studySets, cards } = useStore();
  const [editing, setEditing] = useState<StudySet | "new" | null>(null);

  if (!hydrated) {
    return (
      <div className="space-y-2" aria-busy="true">
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        <p className="text-sm text-muted-foreground">Stapel werden geladen…</p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold">Lernstapel</h2>
          <p className="text-sm text-muted-foreground">
            Eigene Stapel aus Ländern und Faktenarten – zum Beispiel ganz Afrika
            nur mit Hauptstädten.
          </p>
        </div>
        {allowCreate ? (
          <Button
            type="button"
            className="h-10 px-4"
            onClick={() => setEditing("new")}
          >
            <Plus />
            Stapel anlegen
          </Button>
        ) : null}
      </div>

      {studySets.length === 0 ? (
        <EmptyState
          icon={<Layers className="size-5" />}
          title="Noch keine Stapel"
          description="Lege einen Stapel in der Bibliothek an oder wähle auf der Weltkarte einen Kontinent – dann lernst du nur diese Karten."
          actionHref="/weltkarte"
          actionLabel="Kontinent auf der Weltkarte wählen"
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {studySets.map((set) => (
            <li
              key={set.id}
              className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
            >
              <div>
                <h3 className="font-heading text-lg font-semibold">{set.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {studySetSummary(set, cards)}
                </p>
                {set.continent ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ausgang: {continentLabels[set.continent]}
                  </p>
                ) : null}
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <Link
                  href={`/lernen?stapel=${set.id}`}
                  className={cn(buttonVariants({ size: "sm" }))}
                  onClick={() => setActiveStudySet(set.id)}
                >
                  Lernen
                </Link>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(set)}
                >
                  <Pencil />
                  Bearbeiten
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    deleteStudySet(set.id);
                    toast.success(`${set.name} gelöscht. Die Karten bleiben in der Bibliothek.`);
                  }}
                >
                  <Trash2 />
                  Löschen
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <StudySetEditor
        open={editing !== null}
        initial={editing === "new" ? null : editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />
    </section>
  );
}

function StudySetEditor({
  open,
  initial,
  onOpenChange,
}: {
  open: boolean;
  initial: StudySet | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <StudySetEditorForm
          key={initial?.id ?? "new"}
          initial={initial}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  );
}

function StudySetEditorForm({
  initial,
  onOpenChange,
}: {
  initial: StudySet | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [categories, setCategories] = useState<FactCategory[]>(
    initial?.categories ?? defaultStudyCategories()
  );
  const [countryIds, setCountryIds] = useState<string[]>(
    initial?.countryIds ?? []
  );

  const countries = useMemo(
    () =>
      countryIds
        .map((id) => countryById(id))
        .filter((country): country is NonNullable<typeof country> =>
          Boolean(country)
        ),
    [countryIds]
  );

  const canSave = name.trim().length > 0 && categories.length > 0 && countryIds.length > 0;

  return (
    <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Stapel bearbeiten" : "Neuen Stapel anlegen"}
          </DialogTitle>
          <DialogDescription>
            Länder hinzufügen oder entfernen und festlegen, welche Faktenarten
            im Stapel stecken. Bestehende Bewertungen bleiben erhalten.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="stack-name">
              Name
            </label>
            <Input
              id="stack-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="z. B. Südamerika – Hauptstädte"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">Faktenarten</p>
            <CategoryToggles
              categories={
                initial?.categories.includes("sonstiges")
                  ? ALL_FACT_CATEGORIES
                  : STUDY_CATEGORIES
              }
              selected={categories}
              onChange={setCategories}
            />
            {categories.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Mindestens eine Faktenart.
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">Länder ({countryIds.length})</p>
            <CountrySearch
              onSelect={(id) => {
                setCountryIds((current) =>
                  current.includes(id) ? current : [...current, id]
                );
              }}
            />
            {countries.length === 0 ? (
              <p className="rounded-xl border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                Noch keine Länder. Suche oben oder starte mit einem Kontinent
                auf der Weltkarte.
              </p>
            ) : (
              <ul className="max-h-48 overflow-y-auto rounded-xl ring-1 ring-foreground/10">
                {countries.map((country) => (
                  <li
                    key={country.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-sm even:bg-muted/40"
                  >
                    <span>{country.name}</span>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      aria-label={`${country.name} entfernen`}
                      onClick={() =>
                        setCountryIds((current) =>
                          current.filter((id) => id !== country.id)
                        )
                      }
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            type="button"
            disabled={!canSave}
            onClick={() => {
              if (!canSave) return;
              if (initial) {
                updateStudySet(initial.id, { name, categories, countryIds });
                toast.success(`${name.trim()} aktualisiert.`);
              } else {
                createStudySet({ name, categories, countryIds });
                toast.success(`${name.trim()} angelegt.`);
              }
              onOpenChange(false);
            }}
          >
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
  );
}
