import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSessionToken, verifySessionToken } from "./jwt";

// 登入成功後呼叫：簽發 JWT 並寫入 httpOnly cookie
export async function createSession(userId: string) {
  const token = await signSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true, // 瀏覽器的 JavaScript 讀不到，降低被 XSS 竊取的風險
    secure: process.env.NODE_ENV === "production", // 正式環境只透過 HTTPS 傳送
    sameSite: "lax", // 降低 CSRF 風險
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// 從 cookie 取得目前登入者的 userId；未登入或憑證無效回傳 null
export async function getSessionUserId() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}
