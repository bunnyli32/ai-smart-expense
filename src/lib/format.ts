// 金額、日期、月份的格式化工具（前端與後端共用）

export const money = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const pad = (n: number) => String(n).padStart(2, "0");

// 以使用者裝置的當地時間取得今天（YYYY-MM-DD）
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function currentMonth() {
  return today().slice(0, 7);
}

// 月份加減，例如 shiftMonth("2026-01", -1) → "2025-12"
export function shiftMonth(month: string, diff: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + diff, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

// "2026-10" → "2026 年 10 月"
export function formatMonth(month: string) {
  const [y, m] = month.split("-");
  return `${y} 年 ${Number(m)} 月`;
}

// "2026-10" → "10月"
export function formatShortMonth(month: string) {
  return `${Number(month.split("-")[1])}月`;
}

// "2026-10-05" → "10/5"
export function formatDate(date: string) {
  const [, m, d] = date.split("-");
  return `${Number(m)}/${Number(d)}`;
}

// 四捨五入到小數點後兩位，避免加總時出現 0.1 + 0.2 = 0.30000000000000004
export function round2(n: number) {
  return Math.round(n * 100) / 100;
}
