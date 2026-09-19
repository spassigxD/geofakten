import { generateCards, isFactCategory } from "@/lib/cards";
import { extractFromFilename, extractFromText } from "@/lib/mock-extract";
import type { ExtractResult, Fact, FactCategory } from "@/lib/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `Du bist ein Geografie-Tutor. Analysiere das Foto (z. B. Wikipedia-Infobox, Atlas, Schulbuchseite).
Extrahiere das Land oder Gebiet und die wichtigsten Fakten auf Deutsch.
Antworte NUR mit JSON in diesem Schema:
{
  "countryName": "Kurzname auf Deutsch",
  "officialName": "offizieller Name oder null",
  "facts": [
    { "label": "Hauptstadt", "value": "Caracas", "category": "hauptstadt" }
  ]
}
Erlaubte Kategorien: lage, hauptstadt, bevoelkerung, flaeche, sprache, regierung, waehrung, sonstiges.
Maximal 8 Fakten, die wichtigsten zuerst. Werte mit Einheiten (km², Einwohner).
Wenn kein Geografie-Inhalt erkennbar ist:
{ "countryName": null, "facts": [], "error": "Kurze Begründung auf Deutsch" }`;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");
    const filenameField = formData.get("filename");
    const filename =
      (typeof filenameField === "string" && filenameField) ||
      (image instanceof File ? image.name : "") ||
      "";

    if (!(image instanceof File) || image.size === 0) {
      return NextResponse.json(
        { error: "Bitte ein Foto der Lernunterlage hochladen." },
        { status: 400 }
      );
    }

    if (image.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Das Bild ist zu groß. Maximal 8 MB." },
        { status: 413 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        const vision = await extractWithVision(image, apiKey);
        return NextResponse.json(vision);
      } catch (error) {
        const mock = fallbackFromFile(image, filename);
        mock.fallbackReason = `Die Bilderkennung ist fehlgeschlagen (${
          error instanceof Error ? error.message : "unbekannter Fehler"
        }). Es wird die lokale Auswertung genutzt.`;
        return NextResponse.json(mock);
      }
    }

    return NextResponse.json(fallbackFromFile(image, filename));
  } catch {
    return NextResponse.json(
      { error: "Die Auswertung ist fehlgeschlagen. Bitte erneut versuchen." },
      { status: 500 }
    );
  }
}

function fallbackFromFile(image: File, filename: string): ExtractResult {
  return extractFromFilename(`${filename} ${image.name}`);
}

async function extractWithVision(image: File, apiKey: string): Promise<ExtractResult> {
  const buffer = Buffer.from(await image.arrayBuffer());
  const mime = image.type || "image/jpeg";
  const model = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Lies die geografischen Fakten aus diesem Bild und gib JSON zurück.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mime};base64,${buffer.toString("base64")}`,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI ${response.status}: ${body.slice(0, 180)}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Leere Antwort des Sprachmodells");

  const parsed = JSON.parse(content) as {
    countryName?: string | null;
    officialName?: string | null;
    facts?: { label?: string; value?: string; category?: string }[];
    error?: string;
  };

  const countryName = parsed.countryName?.trim();
  const rawFacts = Array.isArray(parsed.facts) ? parsed.facts : [];
  const facts: Fact[] = rawFacts
    .filter((item) => item.label?.trim() && item.value?.trim())
    .map((item) => ({
      label: item.label!.trim(),
      value: item.value!.trim(),
      category: (isFactCategory(item.category ?? "")
        ? item.category
        : "sonstiges") as FactCategory,
    }))
    .slice(0, 8);

  if (!countryName || facts.length === 0) {
    throw new Error(parsed.error || "Kein Geografie-Inhalt erkannt");
  }

  return {
    source: "vision",
    usedFallback: false,
    countryName,
    officialName: parsed.officialName?.trim() || undefined,
    facts,
    cards: generateCards(countryName, facts),
  };
}

export async function GET() {
  return NextResponse.json({
    visionEnabled: Boolean(process.env.OPENAI_API_KEY),
    sample: extractFromText("venezuela"),
  });
}
