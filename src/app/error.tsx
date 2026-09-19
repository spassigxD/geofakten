"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md rounded-3xl border bg-card px-6 py-12 text-center">
      <h1 className="font-heading text-2xl font-semibold">Etwas ist schiefgelaufen</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Die Seite konnte nicht angezeigt werden. Bitte versuche es erneut.
      </p>
      <Button className="mt-6" onClick={reset}>
        Nochmal versuchen
      </Button>
    </div>
  );
}
