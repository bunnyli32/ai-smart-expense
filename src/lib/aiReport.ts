// /api/ai/analyze 回傳的報告格式（前後端共用）
import type { CategoryStat } from "./stats";

// 分析時從資料庫計算出的數字（不是 AI 產生的）
export type AiFacts = {
  income: number;
  expense: number;
  balance: number;
  count: number;
  previous: { income: number; expense: number };
  expenseCategories: CategoryStat[];
};

// 資料充足程度：insufficient＝本月紀錄太少；limited＝沒有前幾個月的紀錄可比較；sufficient＝足夠
export type DataLevel = "insufficient" | "limited" | "sufficient";
export type DataQuality = { level: DataLevel; message: string | null };

export type BudgetItem = {
  category: string;
  // history：依近兩個月實際支出推算；demo：缺少歷史資料，以本月實際金額為起點的示範性預算
  basis: "history" | "demo";
  current: number; // 本月實際支出
  suggested: number; // 程式依 AI 建議的調整幅度換算出的金額
  changePercent: number;
  reason: string;
};

export type AiReportDTO = {
  id: string;
  month: string;
  createdAt: string;
  model: string;
  mock: boolean; // true：模擬分析（未使用 AI）
  dataQuality: DataQuality;
  facts: AiFacts;
  overview: string;
  habits: string[];
  alerts: string[];
  suggestions: { title: string; detail: string }[];
  budget: {
    items: BudgetItem[];
    total: number;
    expectedBalance: number | null; // 若下月收入與本月相同，預估可結餘多少；本月沒有收入時為 null
    note: string;
  };
};

export type AiUsage = { used: number; limit: number };

export type AiMode = "mock" | "ai";
