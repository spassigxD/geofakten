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
          Fällige und unsichere Karten zuerst. Nach der Antwort entscheidest du,
          ob die Karte nochmal, gut oder sehr gut sitzt.
        </p>
      </header>
      <StudySession />
    </div>
  );
}
