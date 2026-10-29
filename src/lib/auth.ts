import "server-only";
import { isValidObjectId } from "mongoose";
import { connectDB } from "./db";
import { getSessionUserId } from "./session";
import { User } from "@/models/User";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
};

// 取得目前登入的會員（只回傳可以給前端看的欄位）；未登入回傳 null
export async function getCurrentUser(): Promise<PublicUser | null> {
  const userId = await getSessionUserId();
  if (!userId || !isValidObjectId(userId)) return null;

  await connectDB();
  const user = await User.findById(userId).lean();
  // 會員已被刪除時，舊的登入憑證也視為無效
  if (!user) return null;

  return { id: String(user._id), name: user.name, email: user.email };
}

// 所有需要登入的 API 都先呼叫這個函式。
// 之後查詢資料時一律使用這裡回傳的 userId，絕不採用前端傳來的 userId，
// 這就是「每位會員只能存取自己資料」的關鍵。
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      response: Response.json({ message: "請先登入" }, { status: 401 }),
    } as const;
  }
  return { user, response: null } as const;
}
