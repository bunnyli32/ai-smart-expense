import { connection, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { toDbDate, toTransactionDTO } from "@/lib/transactions";
import { parseJson, transactionSchema } from "@/lib/validators";
import { Transaction } from "@/models/Transaction";

const notFound = () => Response.json({ message: "找不到這筆紀錄" }, { status: 404 });

// 以下三支 API 查詢時都同時比對 _id 與 userId：
// 就算有人猜到別人紀錄的 id，因為 userId 不符也只會得到 404，無法讀取、修改或刪除

// GET /api/transactions/[id]：查詢單筆
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/transactions/[id]">) {
  await connection();

  try {
    const { user, response } = await requireUser();
    if (!user) return response;

    const { id } = await ctx.params;
    if (!isValidObjectId(id)) return notFound();

    await connectDB();
    const doc = await Transaction.findOne({ _id: id, userId: user.id }).lean();
    if (!doc) return notFound();

    return Response.json({ transaction: toTransactionDTO(doc) });
  } catch (err) {
    console.error("[transactions] 查詢單筆失敗：", err);
    return Response.json({ message: "查詢收支紀錄失敗" }, { status: 500 });
  }
}

// PUT /api/transactions/[id]：修改
export async function PUT(request: NextRequest, ctx: RouteContext<"/api/transactions/[id]">) {
  try {
    const { user, response } = await requireUser();
    if (!user) return response;

    const { id } = await ctx.params;
    if (!isValidObjectId(id)) return notFound();

    const parsed = await parseJson(request, transactionSchema);
    if (!parsed.ok) return Response.json({ message: parsed.error }, { status: 400 });
    const { data } = parsed;

    await connectDB();
    // 只更新白名單欄位，userId 不會被修改
    const doc = await Transaction.findOneAndUpdate(
      { _id: id, userId: user.id },
      {
        $set: {
          type: data.type,
          amount: data.amount,
          category: data.category,
          note: data.note,
          date: toDbDate(data.date),
        },
      },
      { returnDocument: "after", runValidators: true },
    ).lean();
    if (!doc) return notFound();

    return Response.json({ transaction: toTransactionDTO(doc) });
  } catch (err) {
    console.error("[transactions] 修改失敗：", err);
    return Response.json({ message: "修改收支紀錄失敗" }, { status: 500 });
  }
}

// DELETE /api/transactions/[id]：刪除
export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/transactions/[id]">) {
  try {
    const { user, response } = await requireUser();
    if (!user) return response;

    const { id } = await ctx.params;
    if (!isValidObjectId(id)) return notFound();

    await connectDB();
    const result = await Transaction.deleteOne({ _id: id, userId: user.id });
    if (result.deletedCount === 0) return notFound();

    return Response.json({ message: "已刪除" });
  } catch (err) {
    console.error("[transactions] 刪除失敗：", err);
    return Response.json({ message: "刪除收支紀錄失敗" }, { status: 500 });
  }
}
