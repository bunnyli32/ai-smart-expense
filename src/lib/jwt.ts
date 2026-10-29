import { SignJWT, jwtVerify } from "jose";

// 這個檔案只依賴 jose，不連資料庫，所以 proxy.ts 也能使用
// （刻意不加 import "server-only"：proxy 不在 React Server 環境中執行，加了會報錯）

export const SESSION_COOKIE = "ase_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 天（秒）

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("尚未設定環境變數 JWT_SECRET，或長度不足 32 個字元");
  }
  return new TextEncoder().encode(secret);
}

// JWT 裡只放 userId，不放 email、密碼等敏感資料
export async function signSessionToken(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecretKey());
}

// 驗證成功回傳 userId，失敗（被竄改、過期、格式錯誤）一律回傳 null
export async function verifySessionToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
