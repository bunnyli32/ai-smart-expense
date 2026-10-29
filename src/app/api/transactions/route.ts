import { connection, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { ALL_CATEGORIES, TRANSACTION_TYPES, type Category, type TransactionType } from "@/lib/categories";
import { connectDB } from "@/lib/db";
import { monthRange, toDbDate, toTransactionDTO } from "@/lib/transactions";
import { monthString, parseJson, transactionSchema } from "@/lib/validators";
import { Transaction } from "@/models/Transaction";

// GET /api/transactions：查詢自己的收支紀錄
// 可選的篩選條件：?month=2026-10&type=expense&category=餐飲
export async function GET(request: NextRequest) {
  await connection();

  try {
    const { user, response } = await requireUser();
    if (!user) return response;

    // 查詢條件一定包含 userId，所以只會查到自己的紀錄
    const filter: Record<string, unknown> = { userId: user.id };
    const params = request.nextUrl.searchParams;

    const month = params.get("month");
    if (month) {
      if (!monthString.safeParse(month).success) {
        return Response.json({ message: "月份格式不正確" }, { status: 400 });
      }
      const { start, end } = monthRange(month);
      filter.date = { $gte: start, $lt: end };
    }

    const type = params.get("type");
    if (type) {
      if (!TRANSACTION_TYPES.includes(type as TransactionType)) {
        return Response.json({ message: "收支類型不正確" }, { status: 400 });
      }
      filter.type = type;
    }

    const category = params.get("category");
    if (category) {
      if (!ALL_CATEGORIES.includes(category as Category)) {
        return Response.json({ message: "分類不正確" }, { status: 400 });
      }
      filter.category = category;
    }

    await connectDB();
    const docs = await Transaction.find(filter).sort({ date: -1, createdAt: -1 }).limit(1000).lean();

    return Response.json({ transactions: docs.map(toTransactionDTO) });
  } catch (err) {
    console.error("[transactions] 查詢失敗：", err);
    return Response.json({ message: "查詢收支紀錄失敗" }, { status: 500 });
  }
}

// POST /api/transactions：新增一筆收支紀錄
export async function POST(request: Request) {
  try {
    const { user, response } = await requireUser();
    if (!user) return response;

    const parsed = await parseJson(request, transactionSchema);
    if (!parsed.ok) return Response.json({ message: parsed.error }, { status: 400 });
    const { data } = parsed;

    await connectDB();
    // userId 取自登入憑證，不採用前端傳來的值
    const doc = await Transaction.create({
      userId: user.id,
      type: data.type,
      amount: data.amount,
      category: data.category,
      note: data.note,
      date: toDbDate(data.date),
    });

    return Response.json({ transaction: toTransactionDTO(doc.toObject()) }, { status: 201 });
  } catch (err) {
    console.error("[transactions] 新增失敗：", err);
    return Response.json({ message: "新增收支紀錄失敗" }, { status: 500 });
  }
}
