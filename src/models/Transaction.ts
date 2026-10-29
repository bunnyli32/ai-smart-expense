import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { ALL_CATEGORIES, TRANSACTION_TYPES } from "@/lib/categories";

const transactionSchema = new Schema(
  {
    // 這筆紀錄屬於哪位會員：之後每次查詢都必須帶上這個條件，確保只能存取自己的資料
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: String, enum: ALL_CATEGORIES, required: true },
    note: { type: String, trim: true, maxlength: 200, default: "" },
    date: { type: Date, required: true },
  },
  { timestamps: true },
);

// 加快「查某位會員的紀錄、依日期由新到舊排序」
transactionSchema.index({ userId: 1, date: -1 });

export type TransactionDoc = InferSchemaType<typeof transactionSchema>;

export const Transaction =
  (models.Transaction as Model<TransactionDoc>) || model("Transaction", transactionSchema);
