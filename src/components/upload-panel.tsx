"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fileToJpeg } from "@/lib/image";
import { extractFromFilename } from "@/lib/mock-extract";
import { addExtracted } from "@/lib/store";
import { categoryLabels } from "@/lib/labels";
import type { ExtractResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ImagePlus,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml";
const EXAMPLE_PREVIEW = "/examples/venezuela-infobox.svg";

export function UploadPanel() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [thumbnail, setThumbnail] = useState<string>();
  const [open, setOpen] = useState(false);

  async function parseExtractResponse(response: Response): Promise<ExtractResult> {
    const payload = (await response.json()) as ExtractResult & { error?: string };
    if (!response.ok) {
      throw new Error(payload.error || "Auswertung fehlgeschlagen.");
    }
    if (!payload.countryName || payload.facts.length === 0) {
      throw new Error("In dem Foto wurden keine geografischen Fakten gefunden.");
    }
    return payload;
  }

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/") && !file.name.endsWith(".svg")) {
      setError("Bitte eine Bilddatei wählen (JPG, PNG, WebP, SVG).");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError("Das Foto ist zu groß. Maximal 12 MB vor dem Verkleinern.");
      return;
    }

    setLoading(true);
    try {
      let upload: Blob = file;
      let uploadName = file.name;
      try {
        const jpeg = await fileToJpeg(file);
        setPreview(jpeg.dataUrl);
        setThumbnail(jpeg.thumbnail);
        upload = jpeg.blob;
        uploadName = file.name.replace(/\.[^.]+$/, ".jpg");
      } catch {
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        setThumbnail(undefined);
      }

      const body = new FormData();
      body.append("image", upload, uploadName);
      body.append("filename", file.name);

      const payload = await parseExtractResponse(
        await fetch("/api/extract", { method: "POST", body })
      );
      setResult(payload);
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  }

  async function loadExample() {
    setLoading(true);
    setError(null);
    setPreview(EXAMPLE_PREVIEW);
    try {
      const body = new FormData();
      body.append("example", "venezuela");
      body.append("filename", "venezuela-infobox.svg");
      const payload = await parseExtractResponse(
        await fetch("/api/extract", { method: "POST", body })
      );
      setThumbnail(EXAMPLE_PREVIEW);
      setResult(payload);
      setOpen(true);
    } catch {
      const fallback = extractFromFilename("venezuela-infobox.svg");
      setThumbnail(EXAMPLE_PREVIEW);
      setResult(fallback);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  function saveCards() {
    if (!result) return;
    addExtracted(result, thumbnail);
    setOpen(false);
    toast.success(`${result.cards.length} Karten zu ${result.countryName} gespeichert.`);
    router.push("/bibliothek");
  }

  return (
    <section className="space-y-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          const file = event.dataTransfer.files[0];
          if (file) void handleFile(file);
        }}
        className={cn(
          "relative overflow-hidden rounded-3xl border border-dashed bg-card/70 p-5 sm:p-8",
          dragOver && "border-primary bg-primary/5"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
            event.target.value = "";
          }}
        />
        <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
              Aus dem Foto
            </p>
            <h2 className="font-heading mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Infobox fotografieren, Karten lernen
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Lade eine Wikipedia-Infobox, eine Atlas-Seite oder Notizen hoch.
              Geofakten zieht Lage, Hauptstadt, Einwohner, Fläche, Sprache und
              Staatsform und macht daraus Karteikarten.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className={cn(buttonVariants({ size: "lg" }), "h-11 px-4")}
                onClick={() => inputRef.current?.click()}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Upload />
                )}
                Foto wählen
              </button>
              <button
                type="button"
                data-testid="example-venezuela"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 px-4"
                )}
                onClick={() => void loadExample()}
                disabled={loading}
              >
                <Sparkles />
                Beispiel Venezuela
              </button>
            </div>
          </div>
          <div className="relative min-h-40 overflow-hidden rounded-2xl bg-muted">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Vorschau der hochgeladenen Lernunterlage"
                className="h-52 w-full object-cover md:h-64"
              />
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex h-52 w-full flex-col items-center justify-center gap-2 text-muted-foreground md:h-64"
              >
                <ImagePlus className="size-8" />
                <span className="text-sm">Ziehen oder tippen</span>
              </button>
            )}
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 text-sm font-medium">
                <Loader2 className="size-6 animate-spin text-primary" />
                Infobox wird gelesen…
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Auswertung nicht möglich</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Dialog open={open} onOpenChange={(next) => setOpen(next)}>
        {open ? (
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            {result ? (
              <>
                <DialogHeader>
                  <DialogTitle>{result.countryName}</DialogTitle>
                  <DialogDescription>
                    {result.officialName
                      ? `${result.officialName}. `
                      : ""}
                    {result.cards.length} Karteikarten aus den wichtigsten Fakten.
                  </DialogDescription>
                </DialogHeader>
                {result.usedFallback ? (
                  <Alert>
                    <Sparkles />
                    <AlertTitle>Lokale Demo-Auswertung</AlertTitle>
                    <AlertDescription>
                      {result.fallbackReason} Mit{" "}
                      <code>OPENAI_API_KEY</code> liest ein Vision-Modell das Foto
                      direkt.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Gelesen per Vision-Modell.
                  </p>
                )}
                <ul className="space-y-2">
                  {result.facts.map((fact) => (
                    <li
                      key={`${fact.label}-${fact.value}`}
                      className="flex items-start justify-between gap-3 rounded-lg bg-muted/70 px-3 py-2"
                    >
                      <span>
                        <span className="block text-[11px] tracking-wide text-muted-foreground uppercase">
                          {categoryLabels[fact.category]}
                        </span>
                        <span className="font-medium">{fact.label}</span>
                      </span>
                      <span className="max-w-[55%] text-right text-sm">
                        {fact.value}
                      </span>
                    </li>
                  ))}
                </ul>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Verwerfen
                  </Button>
                  <Button onClick={saveCards}>In die Bibliothek</Button>
                </DialogFooter>
              </>
            ) : null}
          </DialogContent>
        ) : null}
      </Dialog>
    </section>
  );
}
