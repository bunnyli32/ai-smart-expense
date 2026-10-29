// 收支分類清單（前端表單與後端驗證共用）
export const EXPENSE_CATEGORIES = ["餐飲", "交通", "購物", "娛樂", "居住", "醫療", "教育", "其他"] as const;
export const INCOME_CATEGORIES = ["薪資", "獎金", "投資", "其他"] as const;

export const ALL_CATEGORIES = Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]));

export const TRANSACTION_TYPES = ["income", "expense"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
