import "server-only";
import { Types } from "mongoose";
import { round2, shiftMonth } from "./format";
import type { StatsDTO } from "./stats";
import { monthRange } from "./transactions";
import { Transaction } from "@/models/Transaction";

const TREND_MONTHS = 6;

type CategoryRow = { _id: { type: "income" | "expense"; category: string }; amount: number; count: number };
type TrendRow = { _id: { month: string; type: "income" | "expense" }; amount: number };

// 計算某位會員某個月的收支統計、分類統計與近 6 個月趨勢。
// /api/stats 與 AI 分析共用這個函式，確保兩邊顯示的數字完全一致。
// 呼叫前請先 connectDB()，userId 必須來自登入憑證。
export async function getMonthStats(userIdString: string, month: string): Promise<StatsDTO> {
  // aggregate 不會自動把字串轉成 ObjectId，必須自己轉，否則會查不到任何資料
  const userId = new Types.ObjectId(userIdString);
  const { start, end } = monthRange(month);
  const trendStart = monthRange(shiftMonth(month, -(TREND_MONTHS - 1))).start;

  const [categoryRows, trendRows] = await Promise.all([
    // 這個月：依「收入/支出 + 分類」加總
    Transaction.aggregate<CategoryRow>([
      { $match: { userId, date: { $gte: start, $lt: end } } },
      { $group: { _id: { type: "$type", category: "$category" }, amount: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { amount: -1 } },
    ]),
    // 近 6 個月：依「月份 + 收入/支出」加總（日期以 UTC 儲存，所以用 UTC 分月）
    Transaction.aggregate<TrendRow>([
      { $match: { userId, date: { $gte: trendStart, $lt: end } } },
      {
        $group: {
          _id: { month: { $dateToString: { format: "%Y-%m", date: "$date" } }, type: "$type" },
          amount: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  const totals = { income: 0, expense: 0 };
  let count = 0;
  for (const row of categoryRows) {
    totals[row._id.type] += row.amount;
    count += row.count;
  }

  const toCategories = (type: "income" | "expense") =>
    categoryRows
      .filter((row) => row._id.type === type)
      .map((row) => ({
        category: row._id.category,
        amount: round2(row.amount),
        count: row.count,
        percent: totals[type] > 0 ? Math.round((row.amount / totals[type]) * 1000) / 10 : 0,
      }));

  // 沒有資料的月份也要補 0，圖表才會連續
  const trend = Array.from({ length: TREND_MONTHS }, (_, i) => {
    const m = shiftMonth(month, i - (TREND_MONTHS - 1));
    const pick = (type: "income" | "expense") =>
      round2(trendRows.find((row) => row._id.month === m && row._id.type === type)?.amount ?? 0);
    return { month: m, income: pick("income"), expense: pick("expense") };
  });

  return {
    month,
    income: round2(totals.income),
    expense: round2(totals.expense),
    balance: round2(totals.income - totals.expense),
    count,
    previous: { income: trend[TREND_MONTHS - 2].income, expense: trend[TREND_MONTHS - 2].expense },
    categories: { expense: toCategories("expense"), income: toCategories("income") },
    trend,
  };
}
