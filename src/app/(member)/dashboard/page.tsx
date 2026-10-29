import type { Metadata } from "next";
import DashboardWelcome from "@/components/DashboardWelcome";

export const metadata: Metadata = { title: "儀表板" };

export default function DashboardPage() {
  return <DashboardWelcome />;
}
