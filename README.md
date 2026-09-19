# Geofakten

German-language geography flashcards. Upload a photo of study material (for example a Wikipedia country infobox), turn it into cards, then review them. Ratings bucket cards into **Nochmal lernen**, **Gut können**, and **Sehr gut können**, and those buckets decide what comes up next.

Cards live in the browser (`localStorage`). There is no account and no database.

## Run locally

```bash
npm install
npm run dev
```

The app is at [http://127.0.0.1:4731](http://127.0.0.1:4731).

```bash
npm run build
npm start
```

## Use it

1. On the start page, upload a photo of an infobox, atlas page, or notes — or tap **Beispiel Venezuela**.
2. Check the extracted facts, then save them to the library.
3. Open **Lernen**, reveal the answer, and rate how well you knew it.
4. Filter the library by learning bucket.

Without an API key the app still works: it matches the filename against a built-in country set (or falls back to Venezuela) so you can demo the full study loop.

## Optional vision model

Copy `.env.example` to `.env.local` and set a key:

```bash
OPENAI_API_KEY=sk-...
```

`/api/extract` then sends the photo to OpenAI vision (`gpt-4o-mini` by default). Override the model with `OPENAI_VISION_MODEL`. If the call fails, the local fallback still returns a usable card set.

Restart `npm run dev` after changing env files.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui.
