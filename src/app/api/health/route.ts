import { connection } from "next/server";
import { connectDB } from "@/lib/db";

// GET /api/health：測試網站是否能成功連上 MongoDB Atlas
export async function GET() {
  // 告訴 Next.js 這支 API 每次都要在請求時執行，不要在 build 時預先產生結果
  await connection();

  const start = Date.now();
  try {
    const mongoose = await connectDB();
    await mongoose.connection.db?.admin().ping();

    return Response.json({
      status: "ok",
      message: "資料庫連線成功",
      database: mongoose.connection.name,
      latencyMs: Date.now() - start,
    });
  } catch (error) {
    // 詳細錯誤只印在伺服器終端機，不回傳給瀏覽器，避免洩漏連線資訊
    console.error("[health] 資料庫連線失敗：", error);
    return Response.json(
      { status: "error", message: "資料庫連線失敗，請查看伺服器終端機的錯誤訊息" },
      { status: 500 },
    );
  }
}
