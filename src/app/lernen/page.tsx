import { Suspense } from "react";
import { StudySession } from "@/components/study-session";

export default function StudyPage() {
  return (
    <div className="space-y-6">
      <header className="text-center">
        <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
          Wiederholen
        </p>
        <h1 className="font-heading mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
          Lernsitzung
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Wähle einen Stapel oder alle Karten. Fällige und unsichere Karten
          zuerst. Nach der Antwort wählst du Nochmal lernen, Gut können oder
          Sehr gut können.
        </p>
      </header>
      <Suspense
        fallback={
          <div className="rounded-2xl border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
            Sitzung wird vorbereitet…
          </div>
        }
      >
        <StudySession />
      </Suspense>
    </div>
  );
}
