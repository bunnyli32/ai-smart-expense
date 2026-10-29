import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email("Email 格式不正確"));

export const registerSchema = z.object({
  name: z.string().trim().min(1, "請輸入暱稱").max(50, "暱稱最多 50 個字"),
  email,
  // bcrypt 只會處理前 72 個位元組，所以限制最大長度
  password: z.string().min(8, "密碼至少需要 8 個字元").max(72, "密碼最多 72 個字元"),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "請輸入密碼"),
});

// 讀取請求的 JSON 並用 zod 驗證；失敗時回傳第一個錯誤訊息
export async function parseJson<T extends z.ZodType>(request: Request, schema: T) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, error: "請求格式錯誤" } as const;
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? "資料格式錯誤" } as const;
  }
  return { ok: true, data: result.data as z.infer<T> } as const;
}
