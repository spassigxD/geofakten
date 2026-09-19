"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import { Minus, Plus, Shuffle, Maximize2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type CountryKind,
  type WorldCollection,
  countryById,
} from "@/lib/world";
import type { ContinentId } from "@/lib/types";
import { CONTINENT_VIEWS, type MapView } from "@/lib/geo";

const MAP_WIDTH = 1000;
/**
 * Shared by the map and its loading placeholder so the page does not jump.
 * Phones get a viewport-relative box; from `sm` up the frame follows the
 * projection's aspect ratio so the world fills it without letterboxing.
 */
export const MAP_FRAME_HEIGHT =
  "h-[52vh] max-h-[26rem] min-h-[17rem] sm:h-auto sm:aspect-[1000/520] sm:max-h-[34rem]";
const MIN_ZOOM = 1;
const MAX_ZOOM = 64;
/** Shapes smaller than this (in map units, ~40 km each) get a clickable dot. */
const DOT_THRESHOLD = 4.5;

const projection = geoNaturalEarth1().fitWidth(MAP_WIDTH, { type: "Sphere" });
const pathBuilder = geoPath(projection);
const sphereBounds = pathBuilder.bounds({ type: "Sphere" });
const MAP_HEIGHT = Math.ceil(sphereBounds[1][1]);

function roundedContext() {
  let parts: string[] = [];
  const r = (value: number) => String(Math.round(value * 100) / 100);
  return {
    beginPath() {
      parts = [];
    },
    moveTo(x: number, y: number) {
      parts.push(`M${r(x)},${r(y)}`);
    },
    lineTo(x: number, y: number) {
      parts.push(`L${r(x)},${r(y)}`);
    },
    arc() {},
    closePath() {
      parts.push("Z");
    },
    flush() {
      const value = parts.join("");
      parts = [];
      return value;
    },
  };
}

const context = roundedContext();
const roundedPath = geoPath(projection, context);

function buildStaticPath(object: Parameters<typeof pathBuilder>[0]): string {
  roundedPath(object);
  return context.flush();
}

const SPHERE_PATH = buildStaticPath({ type: "Sphere" });
const GRATICULE_PATH = buildStaticPath(geoGraticule10());

type Shape = {
  id: string;
  name: string;
  kind: CountryKind;
  continent: ContinentId | null;
  d: string;
  cx: number;
  cy: number;
  /** Longest projected edge; drives both the dot and the zoom target. */
  size: number;
  bounds: [[number, number], [number, number]];
};

function buildShapes(collection: WorldCollection): Shape[] {
  const shapes: Shape[] = [];
  for (const feature of collection.features) {
    const d = buildStaticPath(feature);
    if (!d) continue;
    const meta = countryById(feature.properties.id);
    const bounds = pathBuilder.bounds(feature) as Shape["bounds"];
    const projected = meta ? projection([meta.lon, meta.lat]) : null;
    const centroid = pathBuilder.centroid(feature);
    const [cx, cy] = projected ?? centroid;
    shapes.push({
      id: feature.properties.id,
      name: feature.properties.name,
      kind: feature.properties.kind,
      d,
      cx: Number.isFinite(cx) ? cx : (bounds[0][0] + bounds[1][0]) / 2,
      cy: Number.isFinite(cy) ? cy : (bounds[0][1] + bounds[1][1]) / 2,
      size: Math.max(bounds[1][0] - bounds[0][0], bounds[1][1] - bounds[0][1]),
      bounds,
      continent: meta?.continent ?? feature.properties.continent,
    });
  }
  return shapes;
}

type Transform = { k: number; x: number; y: number };

const IDENTITY: Transform = { k: 1, x: 0, y: 0 };

function clampTransform({ k, x, y }: Transform): Transform {
  const scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k));
  return {
    k: scale,
    x: Math.min(0, Math.max(MAP_WIDTH - MAP_WIDTH * scale, x)),
    y: Math.min(0, Math.max(MAP_HEIGHT - MAP_HEIGHT * scale, y)),
  };
}

function zoomAround(
  transform: Transform,
  factor: number,
  px: number,
  py: number
): Transform {
  const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, transform.k * factor));
  const ratio = k / transform.k;
  return clampTransform({
    k,
    x: px - (px - transform.x) * ratio,
    y: py - (py - transform.y) * ratio,
  });
}

function transformForShape(shape: Shape): Transform {
  const width = shape.bounds[1][0] - shape.bounds[0][0];
  const height = shape.bounds[1][1] - shape.bounds[0][1];
  // Territories that straddle the antimeridian report a near-global box.
  const straddles = width > MAP_WIDTH * 0.55;
  // Micro-states collapse to a point at this resolution, so pick a fixed zoom
  // that shows their neighbourhood around the marker dot.
  const pointLike = Math.max(width, height) < 1.5;

  let scale: number;
  if (straddles) scale = 3;
  else if (pointLike) scale = 14;
  else
    scale = Math.min(
      MAP_WIDTH / (width * 2.6),
      MAP_HEIGHT / (height * 2.6)
    );
  scale = Math.min(MAX_ZOOM, Math.max(2, scale));

  const usesBounds = !straddles && !pointLike;
  const cx = usesBounds
    ? (shape.bounds[0][0] + shape.bounds[1][0]) / 2
    : shape.cx;
  const cy = usesBounds
    ? (shape.bounds[0][1] + shape.bounds[1][1]) / 2
    : shape.cy;
  return clampTransform({
    k: scale,
    x: MAP_WIDTH / 2 - cx * scale,
    y: MAP_HEIGHT / 2 - cy * scale,
  });
}

function transformForView(view: MapView): Transform {
  const northWest = projection([view.minLon, view.maxLat]);
  const southEast = projection([view.maxLon, view.minLat]);
  if (!northWest || !southEast) return IDENTITY;
  const x0 = Math.min(northWest[0], southEast[0]);
  const y0 = Math.min(northWest[1], southEast[1]);
  const x1 = Math.max(northWest[0], southEast[0]);
  const y1 = Math.max(northWest[1], southEast[1]);
  const width = Math.max(8, x1 - x0);
  const height = Math.max(8, y1 - y0);
  const scale = Math.min(
    MAX_ZOOM,
    MAP_WIDTH / (width * 1.18),
    MAP_HEIGHT / (height * 1.18)
  );
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  return clampTransform({
    k: Math.max(1.25, scale),
    x: MAP_WIDTH / 2 - cx * scale,
    y: MAP_HEIGHT / 2 - cy * scale,
  });
}

const Shapes = memo(function Shapes({
  shapes,
  selectedId,
  zoom,
  highlightContinent,
}: {
  shapes: Shape[];
  selectedId: string | null;
  zoom: number;
  highlightContinent: ContinentId | null;
}) {
  const dotRadius = 4.8 / zoom;
  const hitRadius = 13 / zoom;
  const selected = shapes.find((shape) => shape.id === selectedId);
  return (
    <>
      <g>
        {shapes.map((shape) => (
          <path
            key={shape.id}
            d={shape.d}
            data-country={shape.id}
            data-kind={shape.kind}
            data-continent={shape.continent ?? undefined}
            data-dim={
              highlightContinent && shape.continent !== highlightContinent
                ? "true"
                : undefined
            }
            data-selected={shape.id === selectedId ? "true" : undefined}
            className="world-shape"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
      {selected ? (
        <path
          d={selected.d}
          className="world-shape-outline"
          pointerEvents="none"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      <g>
        {shapes.map((shape) =>
          shape.size < DOT_THRESHOLD && shape.size * zoom < 16 ? (
            <g key={`dot-${shape.id}`} data-country={shape.id}>
              <circle
                cx={shape.cx}
                cy={shape.cy}
                r={hitRadius}
                fill="transparent"
                data-country={shape.id}
              />
              <circle
                cx={shape.cx}
                cy={shape.cy}
                r={dotRadius}
                data-country={shape.id}
                data-selected={shape.id === selectedId ? "true" : undefined}
                className="world-dot"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ) : null
        )}
      </g>
    </>
  );
});

export function WorldMap({
  collection,
  selectedId,
  onSelect,
  onRandom,
  focusNonce,
  focusContinent,
  highlightContinent,
  className,
  frameClassName,
}: {
  collection: WorldCollection;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRandom?: () => void;
  /** Bump to re-centre the map on the current selection or continent. */
  focusNonce: number;
  focusContinent?: ContinentId | null;
  highlightContinent?: ContinentId | null;
  className?: string;
  frameClassName?: string;
}) {
  const shapes = useMemo(() => buildShapes(collection), [collection]);
  const byId = useMemo(
    () => new Map(shapes.map((shape) => [shape.id, shape])),
    [shapes]
  );
  const [transform, setTransform] = useState<Transform>(IDENTITY);
  const [hovered, setHovered] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ distance: number; k: number } | null>(null);
  const dragRef = useRef<{ moved: number } | null>(null);
  const animationRef = useRef<number | null>(null);

  const toMapPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return null;
    const point = new DOMPoint(clientX, clientY).matrixTransform(
      matrix.inverse()
    );
    return { x: point.x, y: point.y, unitsPerPixel: 1 / matrix.a };
  }, []);

  const animateTo = useCallback((target: Transform) => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    const start = performance.now();
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    let from: Transform | null = null;
    const step = (now: number) => {
      const progress = reduceMotion ? 1 : Math.min(1, (now - start) / 420);
      const eased = 1 - (1 - progress) ** 3;
      setTransform((current) => {
        from ??= current;
        return {
          k: from.k + (target.k - from.k) * eased,
          x: from.x + (target.x - from.x) * eased,
          y: from.y + (target.y - from.y) * eased,
        };
      });
      if (progress < 1) animationRef.current = requestAnimationFrame(step);
    };
    animationRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => {
    if (!focusNonce) return;
    if (focusContinent) {
      animateTo(transformForView(CONTINENT_VIEWS[focusContinent]));
      return;
    }
    if (!selectedId) return;
    const shape = byId.get(selectedId);
    if (shape) animateTo(transformForShape(shape));
  }, [focusNonce, selectedId, focusContinent, byId, animateTo]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const point = toMapPoint(event.clientX, event.clientY);
      if (!point) return;
      const factor = Math.exp(-event.deltaY * 0.0022);
      setTransform((current) => zoomAround(current, factor, point.x, point.y));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [toMapPoint]);

  const zoomBy = useCallback((factor: number) => {
    setTransform((current) =>
      zoomAround(current, factor, MAP_WIDTH / 2, MAP_HEIGHT / 2)
    );
  }, []);

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    (event.target as Element).setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    dragRef.current = { moved: 0 };
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchRef.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        k: transform.k,
      };
    }
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const target = event.target as SVGElement;
    const id = target.dataset?.country;
    if (event.pointerType !== "touch") {
      const frame = frameRef.current?.getBoundingClientRect();
      setHovered(
        id && frame
          ? {
              id,
              x: event.clientX - frame.left,
              y: event.clientY - frame.top,
            }
          : null
      );
    }

    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    const pinch = pinchRef.current;
    if (pointers.current.size >= 2 && pinch?.distance) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const midpoint = toMapPoint((a.x + b.x) / 2, (a.y + b.y) / 2);
      if (!midpoint) return;
      const ratio = distance / pinch.distance;
      setTransform((current) =>
        zoomAround(current, (pinch.k * ratio) / current.k, midpoint.x, midpoint.y)
      );
      if (dragRef.current) dragRef.current.moved += 10;
      return;
    }

    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    if (dragRef.current) dragRef.current.moved += Math.abs(dx) + Math.abs(dy);
    const reference = toMapPoint(event.clientX, event.clientY);
    if (!reference) return;
    setTransform((current) =>
      clampTransform({
        k: current.k,
        x: current.x + dx * reference.unitsPerPixel,
        y: current.y + dy * reference.unitsPerPixel,
      })
    );
  };

  const endPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;
  };

  const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if ((dragRef.current?.moved ?? 0) > 6) return;
    const id = (event.target as SVGElement).dataset?.country;
    onSelect(id ?? null);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = 80 / transform.k;
    const keys: Record<string, () => void> = {
      ArrowLeft: () =>
        setTransform((c) => clampTransform({ ...c, x: c.x + step * c.k })),
      ArrowRight: () =>
        setTransform((c) => clampTransform({ ...c, x: c.x - step * c.k })),
      ArrowUp: () =>
        setTransform((c) => clampTransform({ ...c, y: c.y + step * c.k })),
      ArrowDown: () =>
        setTransform((c) => clampTransform({ ...c, y: c.y - step * c.k })),
      "+": () => zoomBy(1.4),
      "-": () => zoomBy(1 / 1.4),
      "0": () => animateTo(IDENTITY),
      Escape: () => onSelect(null),
    };
    const action = keys[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  };

  const hoveredName = hovered ? byId.get(hovered.id)?.name : undefined;

  return (
    <div className={cn("world-map relative h-full", className)}>
      <div
        ref={frameRef}
        tabIndex={0}
        role="group"
        aria-label="Interaktive Weltkarte. Pfeiltasten verschieben, Plus und Minus zoomen, 0 setzt zurück."
        onKeyDown={handleKeyDown}
        className={cn(
          "relative overflow-hidden rounded-3xl ring-1 ring-foreground/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          frameClassName ?? MAP_FRAME_HEIGHT
        )}
        style={{ backgroundColor: "var(--map-ocean)" }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          className="block h-full w-full cursor-grab touch-none active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onPointerLeave={(event) => {
            endPointer(event);
            setHovered(null);
          }}
          onClick={handleClick}
          onDoubleClick={(event) => {
            const point = toMapPoint(event.clientX, event.clientY);
            if (point) {
              setTransform((current) =>
                zoomAround(current, 1.9, point.x, point.y)
              );
            }
          }}
        >
          <g
            transform={`translate(${transform.x.toFixed(
              2
            )},${transform.y.toFixed(2)}) scale(${transform.k.toFixed(4)})`}
          >
            <path d={SPHERE_PATH} className="world-ocean" />
            <path
              d={GRATICULE_PATH}
              className="world-graticule"
              vectorEffect="non-scaling-stroke"
            />
            <Shapes
              shapes={shapes}
              selectedId={selectedId}
              zoom={transform.k}
              highlightContinent={highlightContinent ?? null}
            />
          </g>
        </svg>

        {hovered && hoveredName ? (
          <span
            className="pointer-events-none absolute z-10 max-w-48 -translate-x-1/2 -translate-y-[calc(100%+14px)] truncate rounded-full bg-foreground/90 px-2.5 py-1 text-xs font-medium text-background shadow-sm"
            style={{ left: hovered.x, top: hovered.y }}
          >
            {hoveredName}
          </span>
        ) : null}

        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label="Hineinzoomen"
            onClick={() => zoomBy(1.6)}
          >
            <Plus />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label="Herauszoomen"
            onClick={() => zoomBy(1 / 1.6)}
          >
            <Minus />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label="Ganze Welt zeigen"
            onClick={() => animateTo(IDENTITY)}
          >
            <Maximize2 />
          </Button>
          {onRandom ? (
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              aria-label="Zufälliges Land"
              onClick={onRandom}
            >
              <Shuffle />
            </Button>
          ) : null}
        </div>

        <p className="pointer-events-none absolute bottom-2 left-3 text-[11px] text-foreground/55">
          Ziehen zum Verschieben · Scrollen oder Zwei-Finger-Geste zum Zoomen
        </p>
      </div>
    </div>
  );
}
