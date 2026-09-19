import { LibraryView } from "@/components/library-view";

export default function LibraryPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
          Sammlung
        </p>
        <h1 className="font-heading mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
          Bibliothek
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Lernstapel aus Kontinenten oder eigenen Länderlisten – und darunter
          alle Karten nach Land, Filter für Nochmal lernen, Gut können und Sehr
          gut können. Bewertungen aus den Lernsitzungen steuern, was als
          Nächstes kommt.
        </p>
      </header>
      <LibraryView />
    </div>
  );
}
