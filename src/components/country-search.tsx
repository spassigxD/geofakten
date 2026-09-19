"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { continentLabels } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { type CountryMeta, kindLabels, searchCountries } from "@/lib/world";

export function CountrySearch({
  onSelect,
  className,
}: {
  onSelect: (id: string) => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLLIElement | null>(null);

  const results = useMemo(() => searchCountries(query, 40), [query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const choose = (country: CountryMeta) => {
    onSelect(country.id);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            setActive((current) => {
              const next = event.key === "ArrowDown" ? current + 1 : current - 1;
              if (!results.length) return 0;
              return (next + results.length) % results.length;
            });
          } else if (event.key === "Enter") {
            const country = results[active];
            if (country) {
              event.preventDefault();
              choose(country);
            }
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && results[active] ? `${listId}-${results[active].id}` : undefined
        }
        placeholder="Land suchen – z. B. Namibia, Tuvalu, Chile"
        aria-label="Land suchen"
        className="h-11 pr-10 pl-9 text-base"
      />
      {query ? (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Suche leeren"
          className="absolute top-1/2 right-2 -translate-y-1/2"
          onClick={() => {
            setQuery("");
            setOpen(false);
          }}
        >
          <X />
        </Button>
      ) : null}

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Länder"
          className="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-72 overflow-y-auto overscroll-contain rounded-xl bg-popover p-1 shadow-lg ring-1 ring-foreground/10"
        >
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              Kein Land gefunden. Versuch es mit einer anderen Schreibweise.
            </li>
          ) : (
            results.map((country, index) => (
              <li
                key={country.id}
                id={`${listId}-${country.id}`}
                role="option"
                aria-selected={index === active}
                ref={index === active ? activeRef : undefined}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => choose(country)}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm",
                    index === active ? "bg-muted" : "hover:bg-muted/60"
                  )}
                >
                  <span className="truncate font-medium">{country.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {country.kind === "country"
                      ? country.continent
                        ? continentLabels[country.continent]
                        : ""
                      : kindLabels[country.kind]}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
