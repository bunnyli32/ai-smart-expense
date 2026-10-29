import "server-only";
import type { Types } from "mongoose";
import type { TransactionDoc } from "@/models/Transaction";

// 回傳給前端的收支紀錄格式（不包含 userId）
export type TransactionDTO = {
  id: string;
  type: TransactionDoc["type"];
  amount: number;
  category: string;
  note: string;
  date: string; // YYYY-MM-DD
};

// 日期一律以「UTC 午夜」儲存，代表那一天的日曆日期，不受伺服器或使用者所在時區影響
export function toDbDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

// 某個月份（YYYY-MM）的日期範圍：[當月 1 日, 下個月 1 日)
export function monthRange(month: string) {
  const start = toDbDate(`${month}-01`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
}

export function toTransactionDTO(doc: TransactionDoc & { _id: Types.ObjectId }): TransactionDTO {
  return {
    id: String(doc._id),
    type: doc.type,
    amount: doc.amount,
    category: doc.category,
    note: doc.note ?? "",
    date: doc.date.toISOString().slice(0, 10),
  };
}
