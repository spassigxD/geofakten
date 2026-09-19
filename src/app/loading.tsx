export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
      <div className="h-48 animate-pulse rounded-3xl bg-muted" />
      <p className="text-sm text-muted-foreground">Wird geladen…</p>
    </div>
  );
}
