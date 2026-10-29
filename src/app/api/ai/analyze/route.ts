import OpenAI from "openai";
import { connection, type NextRequest } from "next/server";
import { z } from "zod";
import {
  activeModel,
  AiAnalysisError,
  assertWithinLimit,
  buildAdvice,
  buildAiInput,
  DAILY_LIMIT,
  generateAnalysis,
  getUsage,
  toReportDTO,
} from "@/lib/aiAnalysis";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { isMockAi } from "@/lib/openai";
import { monthString, parseJson } from "@/lib/validators";
import { AiReport } from "@/models/AiReport";

// AI 回覆可能需要十幾秒，部署到 Vercel 時放寬執行時間上限
export const maxDuration = 60;

const analyzeSchema = z.object({ month: monthString });

// 同一位會員同時只能有一個分析在進行，避免連點造成重複扣費
const inFlight = new Set<string>();

// GET /api/ai/analyze?month=2026-10：讀取該月最近一次的分析報告（不會呼叫 OpenAI）
export async function GET(request: NextRequest) {
  await connection();

  try {
    const { user, response } = await requireUser();
    if (!user) return response;

    const month = request.nextUrl.searchParams.get("month") ?? "";
    if (!monthString.safeParse(month).success) {
      return Response.json({ message: "月份格式不正確" }, { status: 400 });
    }

    await connectDB();
    const [doc, usage, { facts, fingerprint }] = await Promise.all([
      AiReport.findOne({ userId: user.id, period: month }).sort({ createdAt: -1 }).lean(),
      getUsage(user.id),
      buildAiInput(user.id, month),
    ]);

    return Response.json({
      mode: isMockAi() ? "mock" : "ai",
      count: facts.count,
      report: doc ? toReportDTO(doc) : null,
      // 報告產生後，記帳資料是否又有變動
      stale: doc ? doc.fingerprint !== fingerprint : false,
      usage: { used: usage.used, limit: DAILY_LIMIT },
    });
  } catch (err) {
    console.error("[ai] 讀取報告失敗：", err);
    return Response.json({ message: "讀取分析報告失敗" }, { status: 500 });
  }
}

// POST /api/ai/analyze { month }：使用者按下「產生 AI 分析」時才呼叫
export async function POST(request: Request) {
  let lockedUserId: string | null = null;

  try {
    const { user, response } = await requireUser();
    if (!user) return response;

    const parsed = await parseJson(request, analyzeSchema);
    if (!parsed.ok) return Response.json({ message: parsed.error }, { status: 400 });
    const { month } = parsed.data;

    if (inFlight.has(user.id)) {
      return Response.json({ message: "分析進行中，請稍候" }, { status: 429 });
    }
    inFlight.add(user.id);
    lockedUserId = user.id;

    await connectDB();
    const { input, facts, fingerprint } = await buildAiInput(user.id, month);

    // 沒有資料就不呼叫 AI，避免產生虛構的分析
    if (facts.count === 0) {
      return Response.json({ message: "這個月還沒有記帳資料，無法進行分析", code: "NO_DATA" }, { status: 422 });
    }

    // 資料沒有變動：直接回傳上次的報告，不重複扣費
    const cached = await AiReport.findOne({ userId: user.id, period: month, fingerprint }).sort({ createdAt: -1 }).lean();
    if (cached) {
      const usage = await getUsage(user.id);
      return Response.json({ report: toReportDTO(cached), cached: true, usage: { used: usage.used, limit: DAILY_LIMIT } });
    }

    // 模擬分析免費，不受次數限制；正式 AI 才需要檢查
    if (!isMockAi()) await assertWithinLimit(user.id);

    const output = await generateAnalysis(input);
    const doc = await AiReport.create({
      userId: user.id,
      period: month,
      summary: input,
      fingerprint,
      advice: buildAdvice(output, facts, input),
      model: activeModel(),
    });

    const usage = await getUsage(user.id);
    return Response.json(
      { report: toReportDTO(doc.toObject()), cached: false, usage: { used: usage.used, limit: DAILY_LIMIT } },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof AiAnalysisError) {
      return Response.json({ message: err.message, code: err.code }, { status: err.status });
    }
    // OpenAI 的錯誤只記錄在伺服器，回傳給使用者的訊息不包含任何技術細節
    console.error("[ai] 分析失敗：", err instanceof OpenAI.APIError ? `${err.status} ${err.code ?? err.name}` : err);
    if (err instanceof OpenAI.APIConnectionTimeoutError) {
      return Response.json({ message: "AI 回應逾時，請稍後再試", code: "TIMEOUT" }, { status: 504 });
    }
    // OpenAI 帳戶額度用完（需要到 OpenAI 後台儲值）
    if (err instanceof OpenAI.RateLimitError && (err.type === "insufficient_quota" || err.code === "insufficient_quota")) {
      return Response.json({ message: "AI 服務額度不足，請聯絡網站管理員", code: "AI_QUOTA" }, { status: 503 });
    }
    if (err instanceof OpenAI.RateLimitError) {
      return Response.json({ message: "AI 服務目前忙碌中，請稍後再試", code: "AI_BUSY" }, { status: 503 });
    }
    if (err instanceof OpenAI.APIError) {
      return Response.json({ message: "AI 服務暫時無法使用，請稍後再試", code: "AI_ERROR" }, { status: 502 });
    }
    return Response.json({ message: "分析失敗，請稍後再試" }, { status: 500 });
  } finally {
    if (lockedUserId) inFlight.delete(lockedUserId);
  }
}
