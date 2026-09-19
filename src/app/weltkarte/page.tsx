import type { Metadata } from "next";

import { WorldExplorer } from "@/components/world-explorer";

export const metadata: Metadata = {
  title: "Weltkarte – Geofakten",
  description:
    "Interaktive Weltkarte mit allen Ländern: antippen und Hauptstadt, Einwohnerzahl, Fläche, Sprachen, Staatsform und Währung aus der deutschen Wikipedia lesen.",
};

export default function WeltkartePage() {
  return <WorldExplorer />;
}
