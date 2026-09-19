import {
  CONTINENT_VIEWS,
  continentLabels,
  featuresForContinent,
  geometryToPath,
  project,
  resolveMapLocation,
} from "@/lib/geo";
import { cn } from "@/lib/utils";

const WIDTH = 420;
const HEIGHT = 280;

export function ContinentMap({
  countryName,
  lageText,
  className,
}: {
  countryName: string;
  lageText?: string;
  className?: string;
}) {
  const location = resolveMapLocation(countryName, lageText);
  if (!location) return null;

  const view = CONTINENT_VIEWS[location.continent];
  const features = featuresForContinent(location.continent);
  const highlightIso = location.iso;
  const [markerX, markerY] = project(location.lon, location.lat, view, WIDTH, HEIGHT);
  const continentName = continentLabels[location.continent];

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
          const highlighted = highlightIso !== "" && feature.iso === highlightIso;
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
              strokeWidth={highlighted ? 1.6 : 0.7}
            />
          );
        })}
        {highlightIso ? (
          <g>
            <circle
              cx={markerX}
              cy={markerY}
              r={7}
              fill="oklch(0.42 0.12 45)"
              stroke="oklch(0.99 0.01 95)"
              strokeWidth={2}
            />
            <circle
              cx={markerX}
              cy={markerY}
              r={14}
              fill="none"
              stroke="oklch(0.42 0.12 45 / 0.45)"
              strokeWidth={2}
            />
          </g>
        ) : null}
      </svg>
      <figcaption className="mt-2 text-xs text-muted-foreground">
        {countryName} in {continentName}
      </figcaption>
    </figure>
  );
}
