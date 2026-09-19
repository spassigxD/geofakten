"use client";

import { useState } from "react";
import { flagSources } from "@/lib/flags";
import { cn } from "@/lib/utils";

export function CountryFlag({
  iso2,
  countryName,
  className,
  decorative = false,
}: {
  iso2?: string;
  countryName: string;
  className?: string;
  /** Hide the country from alt text (question side of a flag quiz). */
  decorative?: boolean;
}) {
  const sources = flagSources(iso2);
  const [index, setIndex] = useState(0);
  const src = sources[index];
  const alt = decorative ? "Landesflagge" : `Flagge von ${countryName}`;

  if (!src) {
    return (
      <div
        className={cn(
          "flex h-20 w-32 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground ring-1 ring-foreground/10",
          className
        )}
      >
        Keine Flagge
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn(
        "h-20 w-auto max-w-[10rem] rounded-md object-cover ring-1 ring-foreground/15",
        className
      )}
      onError={() => setIndex((current) => current + 1)}
    />
  );
}
