import type { Metadata } from "next";
import AiAnalysis from "@/components/AiAnalysis";

export const metadata: Metadata = { title: "AI 財務分析" };

export default function AiAnalysisPage() {
  return <AiAnalysis />;
}
