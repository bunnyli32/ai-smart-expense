import "server-only";
import OpenAI from "openai";

// 成本低、中文表現穩定、支援結構化輸出（JSON Schema）的模型；可用 OPENAI_MODEL 環境變數更換
export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

// MOCK_AI=true：使用免費的模擬分析，完全不呼叫 OpenAI
export function isMockAi() {
  return process.env.MOCK_AI === "true";
}

let client: OpenAI | null = null;

// API Key 只在伺服器端讀取，絕不傳到瀏覽器。未設定時回傳 null
export function getOpenAI() {
  // 第二道防線：模擬模式下即使程式誤呼叫，也不會建立連線
  if (isMockAi()) throw new Error("MOCK_AI=true 時禁止呼叫 OpenAI API");
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  // 逾時 45 秒、失敗最多重試 1 次，避免卡住或重複扣費
  client ??= new OpenAI({ apiKey, timeout: 45_000, maxRetries: 1 });
  return client;
}
