"use client";

import {
  CONTINENT_VIEWS,
  continentLabels,
  featureMatchesLocation,
  featuresForContinent,
  geometryBBox,
  geometryToPath,
  project,
  resolveMapLocation,
  viewPixelSize,
  zoomViewAround,
  type MapView,
} from "@/lib/geo";
import type { ContinentId } from "@/lib/types";
import { findCountry } from "@/lib/world";
import { cn } from "@/lib/utils";

const WIDTH = 420;
const HEIGHT = 280;
const TINY_PX = 12;

export function ContinentMap({
  countryName,
  lageText,
  countryId,
  className,
}: {
  countryName: string;
  lageText?: string;
  countryId?: string;
  className?: string;
}) {
  const meta = findCountry(countryId) ?? findCountry(countryName);
  const location = resolveMapLocation(countryName, lageText, countryId);
  if (!location) return null;

  const overview = CONTINENT_VIEWS[location.continent];
  const features = featuresForContinent(location.continent);
  const match = features.find((feature) =>
    featureMatchesLocation(feature, location, countryName, meta?.nameEn)
  );
  const box = match ? geometryBBox(match.geometry) : null;
  const screen = box ? viewPixelSize(box, overview, WIDTH, HEIGHT) : null;
  const tiny =
    !match || !screen || Math.max(screen.w, screen.h) < TINY_PX;
  const view: MapView = tiny
    ? zoomViewAround(location.lon, location.lat, WIDTH, HEIGHT)
    : overview;
  const [markerX, markerY] = project(
    location.lon,
    location.lat,
    view,
    WIDTH,
    HEIGHT
  );
  const continentName = continentLabels[location.continent];
  const hasFix = Boolean(location.iso) || Boolean(match);

  return (
    <figure className={cn("mt-5", className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Karte von ${continentName}, ${countryName} hervorgehoben`}
        className="h-auto w-full overflow-hidden rounded-2xl ring-1 ring-foreground/10"
      >
        <rect width={WIDTH} height={HEIGHT} fill="oklch(0.9 0.025 210)" />
        {features.map((feature) => {
          const d = geometryToPath(feature.geometry, view, WIDTH, HEIGHT);
          if (!d) return null;
          const highlighted = Boolean(match) && feature.iso === match?.iso;
          return (
            <path
              key={feature.iso}
              d={d}
              fill={
                highlighted ? "oklch(0.62 0.13 48)" : "oklch(0.93 0.035 95)"
              }
              stroke={
                highlighted ? "oklch(0.42 0.12 45)" : "oklch(0.78 0.03 90)"
              }
              strokeWidth={highlighted ? 1.8 : 0.7}
            />
          );
        })}
        {hasFix ? (
          <g>
            <circle
              cx={markerX}
              cy={markerY}
              r={tiny ? 9 : 6}
              fill="oklch(0.42 0.12 45)"
              stroke="oklch(0.99 0.01 95)"
              strokeWidth={2}
            />
            <circle
              cx={markerX}
              cy={markerY}
              r={tiny ? 18 : 12}
              fill="none"
              stroke="oklch(0.42 0.12 45 / 0.45)"
              strokeWidth={2}
            />
          </g>
        ) : null}
        {tiny ? (
          <ContinentInset
            continent={location.continent}
            continentView={overview}
            zoomView={view}
            markerLon={location.lon}
            markerLat={location.lat}
          />
        ) : null}
      </svg>
      <figcaption className="mt-2 text-xs text-muted-foreground">
        {countryName} in {continentName}
        {tiny ? " · Ausschnitt vergrößert" : ""}
      </figcaption>
    </figure>
  );
}

function ContinentInset({
  continent,
  continentView,
  zoomView,
  markerLon,
  markerLat,
}: {
  continent: ContinentId;
  continentView: MapView;
  zoomView: MapView;
  markerLon: number;
  markerLat: number;
}) {
  const x = 12;
  const y = 12;
  const w = 108;
  const h = 72;
  const [zx0, zy0] = project(
    zoomView.minLon,
    zoomView.maxLat,
    continentView,
    w,
    h
  );
  const [zx1, zy1] = project(
    zoomView.maxLon,
    zoomView.minLat,
    continentView,
    w,
    h
  );
  const [mx, my] = project(markerLon, markerLat, continentView, w, h);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        width={w}
        height={h}
        rx={8}
        fill="oklch(0.9 0.025 210)"
        stroke="oklch(0.4 0.04 170 / 0.5)"
        strokeWidth={1}
      />
      {featuresForContinent(continent).map((feature) => {
        const d = geometryToPath(feature.geometry, continentView, w, h);
        if (!d) return null;
        return (
          <path
            key={feature.iso}
            d={d}
            fill="oklch(0.93 0.035 95)"
            stroke="oklch(0.78 0.03 90)"
            strokeWidth={0.4}
          />
        );
      })}
      <rect
        x={Math.min(zx0, zx1)}
        y={Math.min(zy0, zy1)}
        width={Math.max(6, Math.abs(zx1 - zx0))}
        height={Math.max(6, Math.abs(zy1 - zy0))}
        fill="oklch(0.62 0.13 48 / 0.35)"
        stroke="oklch(0.42 0.12 45)"
        strokeWidth={1}
      />
      <circle cx={mx} cy={my} r={2.5} fill="oklch(0.42 0.12 45)" />
    </g>
  );
}
