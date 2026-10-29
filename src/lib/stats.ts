// GET /api/stats 回傳的資料格式（前後端共用）

export type CategoryStat = {
  category: string;
  amount: number;
  count: number;
  percent: number; // 佔該月收入或支出總額的百分比
};

export type TrendPoint = { month: string; income: number; expense: number };

export type StatsDTO = {
  month: string;
  income: number;
  expense: number;
  balance: number;
  count: number;
  previous: { income: number; expense: number };
  categories: { expense: CategoryStat[]; income: CategoryStat[] };
  trend: TrendPoint[];
};
