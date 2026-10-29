import { z } from "zod";
import { ALL_CATEGORIES, TRANSACTION_TYPES, categoriesFor, type Category } from "./categories";

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

// 日期格式 YYYY-MM-DD，並確認是真實存在的日期（例如擋下 2026-02-30）
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式不正確")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, "日期不存在");

export const monthString = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "月份格式不正確");

// 新增與修改收支紀錄共用。只接受這些欄位，前端傳來的 userId 等其他欄位會被忽略
export const transactionSchema = z
  .object({
    type: z.enum(TRANSACTION_TYPES, "請選擇收入或支出"),
    amount: z
      .number("請輸入金額")
      .positive("金額必須大於 0")
      .max(100_000_000, "金額過大")
      .transform((n) => Math.round(n * 100) / 100),
    category: z.custom<Category>((v) => ALL_CATEGORIES.includes(v as Category), "請選擇分類"),
    date: dateString,
    note: z.string().trim().max(200, "備註最多 200 個字").default(""),
  })
  .refine((data) => categoriesFor(data.type).includes(data.category), {
    message: "分類與收支類型不符",
    path: ["category"],
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
