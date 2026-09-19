# Geofakten

German-language geography flashcards plus an interactive world map. Upload a photo of study material (for example a Wikipedia country infobox) or click a country on the map, turn the facts into cards, then review them. Ratings bucket cards into **Nochmal lernen**, **Gut können**, and **Sehr gut können**, and those buckets decide what comes up next.

Cards live in the browser (`localStorage`). There is no account and no database.

## Run locally

```bash
npm install
npm run dev
```

Live: [https://spassigxd.github.io/geofakten/](https://spassigxd.github.io/geofakten/)

Locally: [http://127.0.0.1:4731](http://127.0.0.1:4731).

```bash
npm run build
npm start
```

## Use it

1. On the start page, upload a photo of an infobox, atlas page, or notes — or tap **Beispiel Venezuela**.
2. Or open **Weltkarte**, tap a country (pick which facts become cards) or a whole continent.
3. Check the extracted facts, then save them to the library.
4. Open **Lernen**, optionally choose a Stapel, reveal the answer, and rate how well you knew it.
5. Filter the library by learning bucket, or edit stacks there.

Without an API key the app still works: it matches the filename against a built-in country set (or falls back to Venezuela) so you can demo the full study loop. Lage cards show a static continent map (Natural Earth, bundled) with the country highlighted — no map API key needed.

## Weltkarte (`/weltkarte`)

Every country and dependency on one pan- and zoomable map. Clicking a shape opens a fact sheet — side panel on desktop, bottom sheet on mobile — with capital, population, area, official languages, form of government, currency, head of state, and the Wikipedia intro. **Als Karteikarten lernen** turns that fact sheet into a deck without leaving the map.

- Zoom goes deep enough for micro-states; anything smaller than roughly 180 km across also gets a clickable dot so Monaco, Nauru, and Tuvalu stay hittable.
- Mouse, touch (drag + pinch), and keyboard all work. The search box is a listbox combobox, and the map itself takes arrow keys, `+`/`-`, and `0`.
- `/weltkarte#DEU` deep-links to a country by its Natural Earth `ADM0_A3` code.
- **Vollbild** (labeled, top of the page / overlay chrome) expands the map to the viewport. The fact panel stays on the right; on smaller screens the bottom sheet still works. Pan, zoom, search, and continent stacks keep working. Escape or **Vollbild beenden** leaves fullscreen.
- Tick the facts you want before **Als Karteikarten lernen** — at least one. A second save merges into the same country instead of duplicating ratings.

### Lernstapel

Named stacks live next to the global card pile. Create one from a continent on the map (Afrika, Asien, …) or in **Bibliothek → Stapel anlegen**. Each stack is a list of countries plus fact types (Hauptstadt, Lage, Einwohner, Fläche, Sprache, Staatsform, Währung, Flagge). **Flaggen lernen** on the map (or **Flaggen-Stapel** in the library) builds flag-first cards: the learner sees the flag and names the country. You can rename a stack, add/remove countries, and change the fact types. Deleting a stack does not delete the cards or their ratings.

Lage cards draw a Natural Earth continent map and highlight the country by ISO-A3 / German / English name. Micro-states missing from the 110m outlines (Vatican, San Marino, …) get a zoomed inset plus a marker.

Capital answers show the flag from [flagcdn](https://flagcdn.com/) (Wikimedia-style SVG fallbacks if the PNG fails).

**Lernen** has a stack picker: **Alle Karten** or a named stack. Sessions still use the Nochmal lernen / Gut können / Sehr gut können buckets on whatever cards are in the chosen pile.

Deep link: `/lernen?stapel=<id>`.

### Data sources

| What | Source | Licence |
| --- | --- | --- |
| Map geometry, German country names, ISO and Wikidata ids | [Natural Earth](https://www.naturalearthdata.com/) 1:50m Admin 0 countries | public domain |
| Live facts (capital, population, area, languages, currency, government, heads of state) | [Wikidata](https://www.wikidata.org/) REST statements, fetched in the browser | CC0 |
| Flags on capital / flag cards | [flagcdn](https://flagcdn.com/) (PNG/SVG), with [country-flag-icons](https://github.com/catamphetamine/country-flag-icons) as fallback | public CDN |
| Article intro, thumbnail, short description | [German Wikipedia](https://de.wikipedia.org/) REST summary, fetched in the browser | CC BY-SA 4.0 |
| Offline fallback facts | Wikidata snapshot taken at build time, committed to the repo | CC0 |

Both live APIs are CORS-enabled and need no key, so the map works on GitHub Pages with no server. Results are cached in memory and `localStorage` for 14 days; if the network is unavailable the panel falls back to the bundled snapshot and offers a retry.

Regenerate the bundled data (writes `public/data/world-countries.topo.json` and `src/data/world-countries.meta.json`):

```bash
node scripts/build-world-data.mjs
```

## Optional vision model

Copy `.env.example` to `.env.local` and set a key:

```bash
OPENAI_API_KEY=sk-...
```

`/api/extract` then sends the photo to OpenAI vision (`gpt-4o-mini` by default). Override the model with `OPENAI_VISION_MODEL`. If the call fails, the local fallback still returns a usable card set.

Restart `npm run dev` after changing env files.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui.
