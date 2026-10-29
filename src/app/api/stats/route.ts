import { connection, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { currentMonth } from "@/lib/format";
import { getMonthStats } from "@/lib/monthStats";
import { monthString } from "@/lib/validators";

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
    return Response.json(await getMonthStats(user.id, month));
  } catch (err) {
    console.error("[stats] 統計失敗：", err);
    return Response.json({ message: "取得統計資料失敗" }, { status: 500 });
  }
}
