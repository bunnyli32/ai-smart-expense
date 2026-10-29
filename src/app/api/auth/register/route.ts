import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { createSession } from "@/lib/session";
import { parseJson, registerSchema } from "@/lib/validators";
import { User } from "@/models/User";

// POST /api/auth/register：註冊新會員，成功後直接登入
export async function POST(request: Request) {
  const parsed = await parseJson(request, registerSchema);
  if (!parsed.ok) return Response.json({ message: parsed.error }, { status: 400 });
  const { data } = parsed;

  try {
    await connectDB();

    const exists = await User.exists({ email: data.email });
    if (exists) {
      return Response.json({ message: "這個 Email 已經註冊過了" }, { status: 409 });
    }

    // 密碼以 bcrypt 雜湊後才存入資料庫（cost 12：越高越安全但越慢）
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await User.create({ name: data.name, email: data.email, passwordHash });

    await createSession(String(user._id));

    return Response.json(
      { user: { id: String(user._id), name: user.name, email: user.email } },
      { status: 201 },
    );
  } catch (err) {
    // 兩個人幾乎同時用同一個 Email 註冊時，資料庫的 unique 索引會擋下（錯誤碼 11000）
    if (typeof err === "object" && err !== null && "code" in err && err.code === 11000) {
      return Response.json({ message: "這個 Email 已經註冊過了" }, { status: 409 });
    }
    console.error("[register] 註冊失敗：", err);
    return Response.json({ message: "註冊失敗，請稍後再試" }, { status: 500 });
  }
}
