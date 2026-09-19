import { Badge } from "@/components/ui/badge";
import { masteryLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Mastery } from "@/lib/types";

const styles: Record<Mastery, string> = {
  learn:
    "border-transparent bg-[oklch(0.93_0.05_55)] text-[oklch(0.42_0.12_45)]",
  good: "border-transparent bg-[oklch(0.93_0.03_170)] text-[oklch(0.38_0.07_170)]",
  mastered:
    "border-transparent bg-[oklch(0.93_0.04_145)] text-[oklch(0.36_0.08_145)]",
};

export function MasteryBadge({
  mastery,
  className,
}: {
  mastery: Mastery;
  className?: string;
}) {
  return (
    <Badge className={cn(styles[mastery], className)}>{masteryLabels[mastery]}</Badge>
  );
}
