import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const aiReportSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // 分析的月份，格式如 "2026-10"
    period: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
    // 實際送給 AI 的統計摘要（只有月份、金額與分類，不含姓名、Email 與備註）
    summary: { type: Schema.Types.Mixed, required: true },
    // 統計摘要的雜湊值：資料沒有變動時直接沿用舊報告，不再重複呼叫 AI
    fingerprint: { type: String, required: true },
    // 整理後的分析報告（文字由 AI 產生，金額由程式根據資料庫計算）
    advice: { type: Schema.Types.Mixed, required: true },
    model: { type: String, required: true },
  },
  { timestamps: true },
);

aiReportSchema.index({ userId: 1, createdAt: -1 });
aiReportSchema.index({ userId: 1, period: 1, createdAt: -1 });

export type AiReportDoc = InferSchemaType<typeof aiReportSchema>;

export const AiReport = (models.AiReport as Model<AiReportDoc>) || model("AiReport", aiReportSchema);
