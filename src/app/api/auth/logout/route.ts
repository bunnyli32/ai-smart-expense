import { deleteSession } from "@/lib/session";

// POST /api/auth/logout：清除登入 cookie
export async function POST() {
  await deleteSession();
  return Response.json({ message: "已登出" });
}
