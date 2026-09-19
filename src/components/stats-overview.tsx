import { Card, CardContent } from "@/components/ui/card";
import { masteryLabels } from "@/lib/labels";
import { countByMastery, dueCount } from "@/lib/repetition";
import { cn } from "@/lib/utils";
import type { Flashcard } from "@/lib/types";

export function StatsOverview({ cards }: { cards: Flashcard[] }) {
  const due = dueCount(cards);
  const byMastery = countByMastery(cards);

  const items = [
    {
      label: "Heute fällig",
      value: due,
      hint: due === 1 ? "Karte wartet" : "Karten warten",
    },
    {
      label: masteryLabels.learn,
      value: byMastery.learn,
      hint: "wiederholen",
    },
    {
      label: masteryLabels.good,
      value: byMastery.good,
      hint: "im Fluss",
    },
    {
      label: masteryLabels.mastered,
      value: byMastery.mastered,
      hint: "sitzen fest",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item, index) => (
        <Card
          key={item.label}
          className={cn(
            "bg-card/80",
            index === 0 && due > 0 && "ring-1 ring-primary/25"
          )}
        >
          <CardContent className="px-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {item.label}
            </p>
            <p className="font-heading mt-1 text-3xl font-semibold tabular-nums">
              {item.value}
            </p>
            <p className="text-xs text-muted-foreground">{item.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
