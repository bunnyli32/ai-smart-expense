import { connection, type NextRequest } from "next/server";
import { Types } from "mongoose";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { currentMonth, round2, shiftMonth } from "@/lib/format";
import { monthRange } from "@/lib/transactions";
import { monthString } from "@/lib/validators";
import { Transaction } from "@/models/Transaction";

const TREND_MONTHS = 6;

type CategoryRow = { _id: { type: "income" | "expense"; category: string }; amount: number; count: number };
type TrendRow = { _id: { month: string; type: "income" | "expense" }; amount: number };

// GET /api/stats?month=2026-10：某個月的收支統計、分類統計，以及近 6 個月趨勢
export async function GET(request: NextRequest) {
  await connection();

  try {
    const { user, response } = await requireUser();
    if (!user) return response;

    const month = request.nextUrl.searchParams.get("month") ?? currentMonth();
    if (!monthString.safeParse(month).success) {
      return Response.json({ message: "月份格式不正確" }, { status: 400 });
    }

    await connectDB();

    // aggregate 不會自動把字串轉成 ObjectId，必須自己轉，否則會查不到任何資料
    const userId = new Types.ObjectId(user.id);
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

    return Response.json({
      month,
      income: round2(totals.income),
      expense: round2(totals.expense),
      balance: round2(totals.income - totals.expense),
      count,
      previous: { income: trend[TREND_MONTHS - 2].income, expense: trend[TREND_MONTHS - 2].expense },
      categories: { expense: toCategories("expense"), income: toCategories("income") },
      trend,
    });
  } catch (err) {
    console.error("[stats] 統計失敗：", err);
    return Response.json({ message: "取得統計資料失敗" }, { status: 500 });
  }
}
