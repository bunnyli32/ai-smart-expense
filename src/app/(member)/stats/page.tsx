import type { Metadata } from "next";
import StatsOverview from "@/components/StatsOverview";

export const metadata: Metadata = { title: "分類統計" };

export default function StatsPage() {
  return <StatsOverview />;
}
