import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const aiReportSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // 分析的月份，格式如 "2026-10"
    period: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
    // 送給 AI 的統計摘要（只有加總數字，不含使用者的備註內容）
    summary: { type: Schema.Types.Mixed, required: true },
    advice: { type: String, required: true },
  },
  { timestamps: true },
);

aiReportSchema.index({ userId: 1, createdAt: -1 });

export type AiReportDoc = InferSchemaType<typeof aiReportSchema>;

export const AiReport = (models.AiReport as Model<AiReportDoc>) || model("AiReport", aiReportSchema);
