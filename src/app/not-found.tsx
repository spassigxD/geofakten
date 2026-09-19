import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md rounded-3xl border bg-card px-6 py-12 text-center">
      <h1 className="font-heading text-2xl font-semibold">Seite nicht gefunden</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Diese Adresse gibt es in Geofakten nicht.
      </p>
      <Link href="/" className="mt-6 inline-block text-sm font-medium text-primary">
        Zurück zum Start
      </Link>
    </div>
  );
}
