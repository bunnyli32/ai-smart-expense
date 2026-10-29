import "server-only";
import { createHash } from "node:crypto";
import { Types } from "mongoose";
import { z } from "zod";
import type { AiFacts, AiReportDTO, BudgetItem, DataLevel, DataQuality } from "./aiReport";
import { EXPENSE_CATEGORIES } from "./categories";
import { round2, shiftMonth } from "./format";
import { getMonthStats } from "./monthStats";
import { generateMockAnalysis } from "./mockAnalysis";
import { getOpenAI, isMockAi, OPENAI_MODEL } from "./openai";
import { monthRange } from "./transactions";
import { AiReport, type AiReportDoc } from "@/models/AiReport";
import { Transaction } from "@/models/Transaction";

// ───────── 成本控制設定 ─────────
export const DAILY_LIMIT = 10; // 每位會員 24 小時內最多產生幾份新報告
const COOLDOWN_SECONDS = 30; // 兩次產生之間至少間隔幾秒
const MAX_OUTPUT_TOKENS = 1500; // 限制 AI 回覆長度
// 修改提示詞或報告格式時調高版本號，讓舊的快取報告失效
const PROMPT_VERSION = "2";
// 模擬分析存進資料庫時的 model 名稱
export const MOCK_MODEL = "mock";

// 目前使用的分析方式：模擬分析或正式 OpenAI 模型
export const activeModel = () => (isMockAi() ? MOCK_MODEL : OPENAI_MODEL);

export class AiAnalysisError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
  ) {
    super(message);
  }
}

// ───────── 1. 從資料庫整理要送給 AI 的統計摘要 ─────────

// 本月至少要有幾筆紀錄，才判斷消費習慣與過度消費
export const MIN_RECORDS = 5;

const percentChange = (current: number, previous: number) =>
  previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : null;

// 只包含月份、金額、分類與彙總統計；不含姓名、Email、備註或任何會員識別資訊
export async function buildAiInput(userId: string, month: string) {
  const prevMonth = shiftMonth(month, -1);
  const { start, end } = monthRange(month);

  const [stats, prevStats, largest] = await Promise.all([
    getMonthStats(userId, month),
    getMonthStats(userId, prevMonth),
    Transaction.find({ userId: new Types.ObjectId(userId), type: "expense", date: { $gte: start, $lt: end } })
      .sort({ amount: -1 })
      .limit(5)
      .select({ amount: 1, category: 1, date: 1 }) // 刻意不取備註
      .lean(),
  ]);

  const facts: AiFacts = {
    income: stats.income,
    expense: stats.expense,
    balance: stats.balance,
    count: stats.count,
    previous: stats.previous,
    expenseCategories: stats.categories.expense,
  };

  const input = {
    month,
    currency: "TWD",
    income: stats.income,
    expense: stats.expense,
    balance: stats.balance,
    savingsRatePercent: stats.income > 0 ? Math.round((stats.balance / stats.income) * 1000) / 10 : null,
    transactionCount: stats.count,
    expenseChangePercentFromPreviousMonth: percentChange(stats.expense, stats.previous.expense),
    incomeChangePercentFromPreviousMonth: percentChange(stats.income, stats.previous.income),
    expenseByCategory: stats.categories.expense.map((c) => {
      const prev = prevStats.categories.expense.find((p) => p.category === c.category)?.amount ?? 0;
      return { ...c, previousMonthAmount: prev, changePercentFromPreviousMonth: percentChange(c.amount, prev) };
    }),
    incomeByCategory: stats.categories.income,
    previousMonth: { month: prevMonth, ...stats.previous, balance: round2(stats.previous.income - stats.previous.expense) },
    last6Months: stats.trend,
    largestExpenses: largest.map((t) => ({ date: t.date.toISOString().slice(0, 10), category: t.category, amount: t.amount })),
    dataQuality: assessData(stats.count, stats.trend),
  };

  const fingerprint = createHash("sha256")
    .update(`${PROMPT_VERSION}|${activeModel()}|${JSON.stringify(input)}`)
    .digest("hex");

  return { input, facts, fingerprint };
}

export type AiInput = Awaited<ReturnType<typeof buildAiInput>>["input"];

// 判斷資料是否足以做出消費習慣與趨勢的判斷
function assessData(count: number, trend: { income: number; expense: number }[]) {
  // 本月之前（近 5 個月）有記帳紀錄的月份數
  const historyMonths = trend.slice(0, -1).filter((m) => m.income > 0 || m.expense > 0).length;
  const level: DataLevel = count < MIN_RECORDS ? "insufficient" : historyMonths === 0 ? "limited" : "sufficient";
  return { level, transactionCount: count, minRecords: MIN_RECORDS, historyMonths };
}

// 顯示在報告上方的資料提醒（由系統依資料產生，不是 AI 寫的）
function dataQualityOf(input: AiInput): DataQuality {
  const { level, transactionCount } = input.dataQuality;
  if (level === "insufficient") {
    return { level, message: `本月只有 ${transactionCount} 筆紀錄，資料不足，以下分析僅供初步參考。建議至少累積 ${MIN_RECORDS} 筆以上的紀錄。` };
  }
  if (level === "limited") return { level, message: "目前沒有前幾個月的記帳紀錄，無法比較消費趨勢，以下分析僅供參考。" };
  return { level, message: null };
}

// ───────── 2. 頻率限制（只計算正式 AI 報告；模擬分析免費，不計次數）─────────

export async function getUsage(userId: string) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const real = { userId, model: { $ne: MOCK_MODEL } };
  const [used, latest] = await Promise.all([
    AiReport.countDocuments({ ...real, createdAt: { $gte: since } }),
    AiReport.findOne(real).sort({ createdAt: -1 }).select({ createdAt: 1 }).lean(),
  ]);
  return { used, latestAt: latest?.createdAt ?? null };
}

export async function assertWithinLimit(userId: string) {
  const { used, latestAt } = await getUsage(userId);
  if (used >= DAILY_LIMIT) {
    throw new AiAnalysisError(`已達每日 ${DAILY_LIMIT} 次的 AI 分析上限，請明天再試`, 429, "DAILY_LIMIT");
  }
  if (latestAt) {
    const wait = Math.ceil(COOLDOWN_SECONDS - (Date.now() - latestAt.getTime()) / 1000);
    if (wait > 0) throw new AiAnalysisError(`操作太頻繁，請 ${wait} 秒後再試`, 429, "COOLDOWN");
  }
}

// ───────── 3. 呼叫 OpenAI ─────────

const INSTRUCTIONS = `你是「AI 智慧記帳」網站的理財分析助理。使用者在台灣，幣別為新台幣。
請根據使用者提供的 JSON 月度收支統計，用繁體中文（台灣用語）撰寫個人化的財務分析。

規則：
1. 只能根據提供的資料分析。文字中提到的金額、百分比、筆數，必須原樣取自資料，不可自行計算新數字、估算或編造。
2. 文字中不要寫出任何預算金額。下個月預算請用 budget.items 的 changePercent 表達（相對於本月實際支出的調整百分比，-50 到 20 的整數，負數代表減少），系統會自動換算成金額。
3. 不推薦任何特定股票、基金、ETF、加密貨幣、保險商品，也不建議任何高風險投資；可以給一般性的儲蓄、緊急預備金與消費習慣建議。
4. 語氣友善、具體、不說教。建議要能實際執行，例如具體的行動、頻率或方法。
5. 如果資料太少不足以判斷習慣，請如實說明，不要過度推論：
   - dataQuality.level 為 "insufficient"（本月紀錄少於 minRecords 筆）：不要判斷消費習慣、偏高或過度消費；habits 只描述支出分布並說明資料不足；alerts 回傳空陣列；建議以持續記帳等基礎建議為主。
   - dataQuality.level 為 "limited"（沒有前幾個月的紀錄）：不要判斷消費趨勢或增減。
6. 不可只因為某個分類佔支出比例高（例如唯一的分類佔 100%）就判定該分類支出過高；判斷「增加」或「偏高」必須有上個月的資料可以比較。

欄位說明：
- overview：2～3 句話，總結本月收入、支出、結餘，以及與上個月相比的變化。
- habits：2～4 點，說明主要支出類別與消費習慣。
- alerts：0～3 點，值得注意的支出情況（例如增幅明顯的分類、單筆大額支出、支出大於收入）；沒有就回傳空陣列。
- suggestions：剛好 3 項具體、可執行的改善建議。title 不超過 15 個字，detail 1～2 句。
- budget.items：為本月每個有支出的分類各給一項，category 必須是資料中出現的支出分類，reason 用一句話說明調整原因。previousMonthAmount 為 0 的分類沒有歷史資料，changePercent 請填 0（系統會標示為示範性預算）。
- budget.note：1～2 句話說明下個月的整體預算規劃方向。`;

const outputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["overview", "habits", "alerts", "suggestions", "budget"],
  properties: {
    overview: { type: "string" },
    habits: { type: "array", items: { type: "string" } },
    alerts: { type: "array", items: { type: "string" } },
    suggestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "detail"],
        properties: { title: { type: "string" }, detail: { type: "string" } },
      },
    },
    budget: {
      type: "object",
      additionalProperties: false,
      required: ["items", "note"],
      properties: {
        note: { type: "string" },
        items: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["category", "changePercent", "reason"],
            properties: {
              category: { type: "string", enum: [...EXPENSE_CATEGORIES] },
              changePercent: { type: "integer" },
              reason: { type: "string" },
            },
          },
        },
      },
    },
  },
};

// 即使 OpenAI 已依 JSON Schema 回覆，仍再驗證一次並限制長度
const text = (max: number) => z.string().trim().min(1).transform((s) => s.slice(0, max));
const aiOutputSchema = z.object({
  overview: text(400),
  habits: z.array(text(200)).min(1).transform((a) => a.slice(0, 4)),
  alerts: z.array(text(200)).transform((a) => a.slice(0, 3)),
  suggestions: z.array(z.object({ title: text(30), detail: text(200) })).min(3).transform((a) => a.slice(0, 3)),
  budget: z.object({
    note: text(300),
    items: z.array(z.object({ category: z.string(), changePercent: z.number(), reason: text(120) })),
  }),
});
export type AiOutput = z.infer<typeof aiOutputSchema>;

// 把資料中出現過的數字全部收集起來，用來核對 AI 文字中的金額
function collectNumbers(value: unknown, out: number[]) {
  if (typeof value === "number") out.push(Math.abs(value));
  else if (typeof value === "string" && /^\d{4}-\d{2}(-\d{2})?$/.test(value)) out.push(...value.split("-").map(Number));
  else if (Array.isArray(value)) value.forEach((v) => collectNumbers(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => collectNumbers(v, out));
}

// 找出 AI 文字中「大於 100、但資料裡沒有」的數字（允許 ±1 的四捨五入誤差）
function findUnverifiedNumbers(output: AiOutput, input: AiInput) {
  const allowed: number[] = [];
  collectNumbers(input, allowed);
  const texts = [
    output.overview,
    ...output.habits,
    ...output.alerts,
    ...output.suggestions.flatMap((s) => [s.title, s.detail]),
    output.budget.note,
    ...output.budget.items.map((i) => i.reason),
  ];
  const unverified: string[] = [];
  for (const t of texts) {
    for (const match of t.matchAll(/\d[\d,]*(?:\.\d+)?/g)) {
      const n = Number(match[0].replace(/,/g, ""));
      if (n > 100 && !allowed.some((a) => Math.abs(a - n) <= 1)) unverified.push(match[0]);
    }
  }
  return unverified;
}

async function callOpenAI(input: AiInput, extraNote = "") {
  const openai = getOpenAI();
  if (!openai) throw new AiAnalysisError("AI 服務尚未設定，請聯絡網站管理員", 503, "NOT_CONFIGURED");

  const response = await openai.responses.create({
    model: OPENAI_MODEL,
    instructions: INSTRUCTIONS + extraNote,
    input: `以下是使用者 ${input.month} 的收支統計（JSON）：\n${JSON.stringify(input)}`,
    text: { format: { type: "json_schema", name: "monthly_financial_report", schema: outputSchema, strict: true } },
    max_output_tokens: MAX_OUTPUT_TOKENS,
    store: false, // 不讓 OpenAI 保存這次對話
  });

  if (response.status === "incomplete") {
    throw new AiAnalysisError("AI 回覆不完整，請稍後再試", 502, "INCOMPLETE");
  }

  let json: unknown;
  try {
    json = JSON.parse(response.output_text);
  } catch {
    throw new AiAnalysisError("AI 回覆格式錯誤，請稍後再試", 502, "BAD_OUTPUT");
  }
  const parsed = aiOutputSchema.safeParse(json);
  if (!parsed.success) throw new AiAnalysisError("AI 回覆格式錯誤，請稍後再試", 502, "BAD_OUTPUT");
  return parsed.data;
}

// 呼叫 AI 並核對數字；AI 寫出資料中沒有的金額時，重試一次，仍不符就放棄
export async function generateAnalysis(input: AiInput) {
  // 模擬模式：依真實統計用固定規則產生，完全不呼叫 OpenAI
  if (isMockAi()) {
    const output = generateMockAnalysis(input);
    if (findUnverifiedNumbers(output, input).length > 0) {
      throw new AiAnalysisError("模擬分析產生失敗，請稍後再試", 500, "MOCK_ERROR");
    }
    return output;
  }

  let output = await callOpenAI(input);
  let unverified = findUnverifiedNumbers(output, input);
  if (unverified.length > 0) {
    console.warn("[ai] 回覆含有資料中沒有的數字，重試一次：", unverified);
    output = await callOpenAI(input, `\n\n注意：上一次的回覆寫了資料中沒有的數字（${unverified.join("、")}），請只使用資料中的數字。`);
    unverified = findUnverifiedNumbers(output, input);
    if (unverified.length > 0) {
      console.warn("[ai] 重試後仍含有資料中沒有的數字：", unverified);
      throw new AiAnalysisError("AI 分析結果未通過數字核對，請稍後再試", 502, "UNVERIFIED_NUMBERS");
    }
  }
  return output;
}

// ───────── 4. 整理成報告：所有金額都由程式根據資料庫計算 ─────────

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(Math.round(n), min), max);
// 預算金額取整：1,000 元以上取到百位，以下取到十位
const roundBudget = (n: number) => (n >= 1000 ? Math.round(n / 100) * 100 : Math.round(n / 10) * 10);

export function buildAdvice(output: AiOutput, facts: AiFacts, input: AiInput) {
  const dataQuality = dataQualityOf(input);
  const items: BudgetItem[] = input.expenseByCategory.map((c) => {
    // 本月紀錄足夠、且上個月也有這個分類的支出，才算「依據歷史資料推算」
    const basis = dataQuality.level !== "insufficient" && c.previousMonthAmount > 0 ? "history" : "demo";
    if (basis === "demo") {
      return {
        category: c.category,
        basis,
        current: c.amount,
        suggested: roundBudget(c.amount),
        changePercent: 0,
        reason: "缺少足夠的歷史資料，暫以本月實際金額作為起點",
      };
    }
    const ai = output.budget.items.find((i) => i.category === c.category);
    const changePercent = clamp(ai?.changePercent ?? 0, -50, 20);
    return {
      category: c.category,
      basis,
      current: c.amount,
      suggested: roundBudget(c.amount * (1 + changePercent / 100)),
      changePercent,
      reason: ai?.reason ?? "維持本月水準",
    };
  });
  const total = items.reduce((sum, i) => sum + i.suggested, 0);

  return {
    dataQuality,
    facts,
    overview: output.overview,
    habits: output.habits,
    alerts: output.alerts,
    suggestions: output.suggestions,
    budget: {
      items,
      total,
      expectedBalance: facts.income > 0 ? round2(facts.income - total) : null,
      note: output.budget.note,
    },
  };
}

type ReportDoc = AiReportDoc & { _id: Types.ObjectId; createdAt: Date };

export function toReportDTO(doc: ReportDoc): AiReportDTO {
  const advice = doc.advice as ReturnType<typeof buildAdvice>;
  return {
    id: String(doc._id),
    month: doc.period,
    createdAt: doc.createdAt.toISOString(),
    model: doc.model,
    mock: doc.model === MOCK_MODEL,
    ...advice,
    // 舊版報告沒有資料充足程度的欄位，視為沒有提醒
    dataQuality: advice.dataQuality ?? { level: "sufficient", message: null },
  };
}
