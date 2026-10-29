import "server-only";
import type { AiInput, AiOutput } from "./aiAnalysis";
import { formatMonth } from "./format";

// 模擬分析：不呼叫任何 AI，依會員的真實收支統計用固定規則產生報告。
// 文字中的數字全部直接取自統計資料，不另外計算新數字。
// 判斷原則：資料不足時只描述事實，不判斷消費習慣或過度消費；
// 「增加」「偏高」一定要有上個月的資料可以比較，不能只看本月佔比。

const fmt = (n: number) => n.toLocaleString("zh-TW", { maximumFractionDigits: 2 });
const DISCRETIONARY = ["購物", "娛樂", "餐飲"]; // 非必要、較容易調整的支出
const GROWTH_ALERT_PERCENT = 30; // 比上個月增加超過這個幅度才提醒
const MIN_CATEGORY_COUNT = 2; // 分類至少要有幾筆，才判斷它的增減

export function generateMockAnalysis(d: AiInput): AiOutput {
  const { level, transactionCount } = d.dataQuality;
  const fewRecords = level === "insufficient";
  const hasHistory = level === "sufficient";
  const expenses = d.expenseByCategory;
  const top = expenses[0];

  // 有上個月資料可比較、本月也有足夠筆數，才能判斷這個分類的增減
  const comparable = (c: AiInput["expenseByCategory"][number]) =>
    hasHistory && c.previousMonthAmount > 0 && c.count >= MIN_CATEGORY_COUNT && c.changePercentFromPreviousMonth !== null;
  const grown = expenses.filter((c) => comparable(c) && c.changePercentFromPreviousMonth! >= GROWTH_ALERT_PERCENT);

  // ── 收支摘要 ──
  let overview = `${formatMonth(d.month)}收入 ${fmt(d.income)} 元、支出 ${fmt(d.expense)} 元，結餘 ${fmt(d.balance)} 元。`;
  if (d.income === 0) overview += "本月沒有收入紀錄，建議也把收入記下來，才能完整掌握收支。";
  else if (d.savingsRatePercent !== null) overview += `儲蓄率為 ${d.savingsRatePercent}%。`;
  const change = d.expenseChangePercentFromPreviousMonth;
  if (hasHistory && change !== null) overview += change === 0 ? "支出與上個月持平。" : `支出比上個月${change > 0 ? "增加" : "減少"} ${Math.abs(change)}%。`;
  if (fewRecords) overview += `本月只有 ${transactionCount} 筆紀錄，資料不足，僅供初步參考。`;

  // ── 主要支出類別與消費習慣 ──
  const habits: string[] = [];
  if (!top) {
    habits.push("本月沒有支出紀錄。");
  } else if (fewRecords) {
    // 資料不足：只描述事實，不下判斷
    habits.push(`本月的支出記錄在 ${expenses.length} 個分類，目前以${top.category}為主（${fmt(top.amount)} 元）。`);
    habits.push(`記帳筆數還少（${transactionCount} 筆），還無法判斷消費習慣，累積更多紀錄後分析會更準確。`);
  } else {
    habits.push(`${top.category}是本月最大的支出分類，共 ${top.count} 筆、${fmt(top.amount)} 元，佔總支出 ${top.percent}%。`);
    const frequent = [...expenses].sort((a, b) => b.count - a.count)[0];
    if (frequent.count >= 3) habits.push(`${frequent.category}的消費次數最多（${frequent.count} 筆），屬於日常經常發生的支出。`);
    if (!hasHistory) habits.push("目前沒有前幾個月的紀錄，還無法判斷消費趨勢。");
    else if (grown.length === 0) habits.push("和上個月相比，各分類支出沒有明顯增加。");
  }
  const mainIncome = d.incomeByCategory[0];
  if (mainIncome && !fewRecords) habits.push(`主要收入來源為${mainIncome.category}，佔收入 ${mainIncome.percent}%。`);

  // ── 值得注意的支出情況：資料不足時不提出 ──
  const alerts: string[] = [];
  if (!fewRecords) {
    // 沒有收入紀錄時，結餘為負只是因為收入沒記，不列為警示
    if (d.income > 0 && d.balance < 0) alerts.push(`本月支出比收入多 ${fmt(Math.abs(d.balance))} 元，結餘為負。`);
    for (const c of grown) {
      alerts.push(`${c.category}比上個月增加 ${c.changePercentFromPreviousMonth}%（${fmt(c.previousMonthAmount)} 元 → ${fmt(c.amount)} 元）。`);
    }
    if (d.savingsRatePercent !== null && d.savingsRatePercent >= 0 && d.savingsRatePercent < 20) {
      alerts.push(`儲蓄率為 ${d.savingsRatePercent}%，低於一般建議的 20%。`);
    }
  }

  // ── 三項改善建議 ──
  const suggestions: AiOutput["suggestions"] = [];
  if (fewRecords) {
    suggestions.push({ title: "養成每天記帳的習慣", detail: `本月目前只有 ${transactionCount} 筆紀錄，建議每天睡前花一分鐘記下當天的收支，讓分析更準確。` });
    if (d.income === 0) suggestions.push({ title: "記得記錄收入", detail: "把薪資、獎金等收入也記下來，才能算出結餘與儲蓄率。" });
  } else {
    const flexibleGrown = grown.find((c) => DISCRETIONARY.includes(c.category));
    if (flexibleGrown) {
      suggestions.push({
        title: `為${flexibleGrown.category}設定每週預算`,
        detail: `${flexibleGrown.category}比上個月增加 ${flexibleGrown.changePercentFromPreviousMonth}%，可以把月預算分成四週，每週檢查一次。`,
      });
    }
    if (d.income > 0 && (d.savingsRatePercent ?? 0) < 30) {
      suggestions.push({ title: "發薪日先存再花", detail: "收入入帳當天，先把固定比例轉入儲蓄帳戶，剩下的才用於日常開銷。" });
    }
    if (!hasHistory) suggestions.push({ title: "持續記帳到下個月", detail: "累積兩個月以上的紀錄後，就能比較每月的支出變化，找出可以調整的分類。" });
  }
  for (const fallback of [
    { title: "每週回顧一次記帳", detail: "每週固定花五分鐘看看本週的支出，掌握各分類的花費情況。" },
    { title: "建立緊急預備金", detail: "逐步存下 3～6 個月的生活費作為緊急預備金，應付突發狀況。" },
    { title: "區分必要與非必要支出", detail: "記帳時留意哪些是必要開銷、哪些可以延後，方便之後調整預算。" },
  ]) {
    if (suggestions.length < 3) suggestions.push(fallback);
  }

  // ── 下個月預算 ──
  // 有上個月資料的分類：朝「本月與上月的平均」調整（系統限制單月最多增加 20%）；
  // 沒有歷史資料的分類由系統標示為示範性預算（以本月實際金額為起點），這裡填 0
  const items = expenses.map((c) => {
    if (fewRecords || c.previousMonthAmount <= 0) {
      return { category: c.category, changePercent: 0, reason: "缺少足夠的歷史資料，暫以本月實際金額作為起點" };
    }
    const average = (c.amount + c.previousMonthAmount) / 2;
    return {
      category: c.category,
      changePercent: Math.round(((average - c.amount) / c.amount) * 100),
      reason: `參考近兩個月的支出推算（上月 ${fmt(c.previousMonthAmount)} 元、本月 ${fmt(c.amount)} 元）`,
    };
  });

  const anyHistory = items.some((i) => i.reason.startsWith("參考近兩個月"));
  return {
    overview,
    habits: habits.slice(0, 4),
    alerts: alerts.slice(0, 3),
    suggestions: suggestions.slice(0, 3),
    budget: {
      items,
      note: fewRecords
        ? "目前資料不足，以下為示範性預算，以本月實際金額作為起點；建議持續記帳，累積更多紀錄後再參考。"
        : anyHistory
          ? "標示「歷史推算」的分類參考近兩個月的平均支出計算；標示「示範」的分類缺少上個月的資料，暫以本月實際金額作為起點。"
          : "目前沒有上個月的資料可以比較，以下為示範性預算，以本月實際金額作為起點。",
    },
  };
}
