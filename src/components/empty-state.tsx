import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  actionHref = "/",
  actionLabel = "Foto hochladen",
  icon,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card/60 px-6 py-14 text-center">
      {icon ? (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-primary">
          {icon}
        </div>
      ) : null}
      <h2 className="font-heading text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <Link
        href={actionHref}
        className={cn(buttonVariants({ size: "lg" }), "mt-6 h-10 px-4")}
      >
        {actionLabel}
      </Link>
    </div>
  );
}
