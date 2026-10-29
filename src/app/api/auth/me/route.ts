import { connection } from "next/server";
import { requireUser } from "@/lib/auth";

// GET /api/auth/me：取得目前登入的會員資料
export async function GET() {
  // 每次請求才執行，不要在 build 時預先產生（登入狀態因人而異）
  await connection();

  try {
    const { user, response } = await requireUser();
    if (!user) return response;
    return Response.json({ user });
  } catch (err) {
    console.error("[me] 取得會員資料失敗：", err);
    return Response.json({ message: "取得會員資料失敗" }, { status: 500 });
  }
}
