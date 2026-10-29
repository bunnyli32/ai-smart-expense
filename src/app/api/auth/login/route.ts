import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { createSession } from "@/lib/session";
import { loginSchema, parseJson } from "@/lib/validators";
import { User } from "@/models/User";

// 帳號不存在時也做一次比對，讓回應時間和「密碼錯誤」差不多，避免被用來猜測哪些 Email 有註冊
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 12);

// POST /api/auth/login：會員登入
export async function POST(request: Request) {
  const parsed = await parseJson(request, loginSchema);
  if (!parsed.ok) return Response.json({ message: parsed.error }, { status: 400 });
  const { data } = parsed;

  try {
    await connectDB();

    // passwordHash 預設不會被查出來，這裡需要比對所以明確加上 +passwordHash
    const user = await User.findOne({ email: data.email }).select("+passwordHash");
    const passwordOk = await bcrypt.compare(data.password, user?.passwordHash ?? DUMMY_HASH);

    if (!user || !passwordOk) {
      // 不透露是 Email 還是密碼錯誤
      return Response.json({ message: "Email 或密碼錯誤" }, { status: 401 });
    }

    await createSession(String(user._id));

    return Response.json({ user: { id: String(user._id), name: user.name, email: user.email } });
  } catch (err) {
    console.error("[login] 登入失敗：", err);
    return Response.json({ message: "登入失敗，請稍後再試" }, { status: 500 });
  }
}
