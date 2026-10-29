import type { Metadata } from "next";
import DashboardOverview from "@/components/DashboardOverview";

export const metadata: Metadata = { title: "儀表板" };

export default function DashboardPage() {
  return <DashboardOverview />;
}
