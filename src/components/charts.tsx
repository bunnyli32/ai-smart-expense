"use client";

import { useState } from "react";
import { formatShortMonth, money } from "@/lib/format";
import type { CategoryStat, StatsDTO, TrendPoint } from "@/lib/stats";

// 圖表配色：沿用全站「收入綠、支出紅」，已用色盲模擬驗證兩色可區分
const INCOME_COLOR = "bg-emerald-600";
const EXPENSE_COLOR = "bg-rose-500";

// ───────── 本月摘要（收入／支出／結餘） ─────────

function changeText(current: number, previous: number) {
  if (previous <= 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return "與上月持平";
  return `比上月${pct > 0 ? "增加" : "減少"} ${Math.abs(pct)}%`;
}

export function SummaryTiles({ stats }: { stats: Pick<StatsDTO, "income" | "expense" | "balance" | "count" | "previous"> }) {
  const tiles = [
    { label: "收入", value: stats.income, color: "text-emerald-600", change: changeText(stats.income, stats.previous.income) },
    { label: "支出", value: stats.expense, color: "text-rose-500", change: changeText(stats.expense, stats.previous.expense) },
    { label: "結餘", value: stats.balance, color: stats.balance < 0 ? "text-rose-500" : "text-slate-900", change: `共 ${stats.count} 筆紀錄` },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
          <p className="text-xs text-slate-500 sm:text-sm">{t.label}</p>
          <p className={`mt-1 break-all text-[15px] font-bold leading-tight tabular-nums sm:text-2xl ${t.color}`}>{money.format(t.value)}</p>
          {t.change && <p className="mt-1 hidden text-xs text-slate-500 sm:block">{t.change}</p>}
        </div>
      ))}
    </div>
  );
}

// ───────── 分類長條圖（由大到小） ─────────

export function CategoryBars({ items, type, limit }: { items: CategoryStat[]; type: "income" | "expense"; limit?: number }) {
  const shown = limit ? items.slice(0, limit) : items;
  const max = Math.max(...shown.map((i) => i.amount), 1);
  const color = type === "income" ? INCOME_COLOR : EXPENSE_COLOR;

  if (shown.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">這個月還沒有{type === "income" ? "收入" : "支出"}紀錄</p>;
  }

  return (
    <ul className="space-y-3.5">
      {shown.map((item) => (
        <li key={item.category} title={`${item.category}：${money.format(item.amount)}（${item.percent === 0 ? "<0.1" : item.percent}%，${item.count} 筆）`}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-medium text-slate-700">{item.category}</span>
            <span className="text-slate-900">
              {money.format(item.amount)}
              <span className="ml-1.5 text-xs text-slate-500">{item.percent === 0 ? "<0.1" : item.percent}%</span>
            </span>
          </div>
          <div className="mt-1.5 h-2.5 rounded-full bg-slate-100">
            <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.max((item.amount / max) * 100, 1.5)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ───────── 近 6 個月收支趨勢（分組直條圖） ─────────

export function TrendChart({ trend, selectedMonth }: { trend: TrendPoint[]; selectedMonth: string }) {
  // 滑鼠移入或手指點選的月份；預設顯示目前選擇的月份
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const active = trend.find((t) => t.month === (activeMonth ?? selectedMonth)) ?? trend[trend.length - 1];
  const max = Math.max(...trend.flatMap((t) => [t.income, t.expense]), 1);
  const empty = trend.every((t) => t.income === 0 && t.expense === 0);

  return (
    <div>
      {/* 圖例 */}
      <div className="flex items-center gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-sm ${INCOME_COLOR}`} aria-hidden="true" />
          收入
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-sm ${EXPENSE_COLOR}`} aria-hidden="true" />
          支出
        </span>
      </div>

      {empty ? (
        <p className="py-12 text-center text-sm text-slate-500">近 6 個月還沒有任何紀錄</p>
      ) : (
        <>
          {/* 目前選取月份的數字 */}
          <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700" aria-live="polite">
            <span className="font-semibold text-slate-900">{formatShortMonth(active.month)}</span>
            ：收入 {money.format(active.income)}．支出 {money.format(active.expense)}．結餘 {money.format(active.income - active.expense)}
          </p>

          <div className="relative mt-4">
            <span className="absolute -top-1 right-0 text-[11px] text-slate-400">{money.format(max)}</span>
            <div className="flex h-44 items-end gap-1 border-b border-slate-200 pt-4 sm:gap-3" onMouseLeave={() => setActiveMonth(null)}>
              {trend.map((t) => (
                <button
                  key={t.month}
                  type="button"
                  onMouseEnter={() => setActiveMonth(t.month)}
                  onFocus={() => setActiveMonth(t.month)}
                  onClick={() => setActiveMonth(t.month)}
                  aria-label={`${formatShortMonth(t.month)}：收入 ${money.format(t.income)}，支出 ${money.format(t.expense)}`}
                  className={`flex h-full flex-1 items-end justify-center gap-0.5 rounded-t-lg transition ${
                    active.month === t.month ? "bg-slate-100" : "hover:bg-slate-50"
                  }`}
                >
                  <span className={`w-3 rounded-t sm:w-5 ${INCOME_COLOR}`} style={{ height: `${(t.income / max) * 100}%` }} />
                  <span className={`w-3 rounded-t sm:w-5 ${EXPENSE_COLOR}`} style={{ height: `${(t.expense / max) * 100}%` }} />
                </button>
              ))}
            </div>
            <div className="mt-1.5 flex gap-1 sm:gap-3">
              {trend.map((t) => (
                <span key={t.month} className={`flex-1 text-center text-xs ${t.month === selectedMonth ? "font-semibold text-slate-900" : "text-slate-500"}`}>
                  {formatShortMonth(t.month)}
                </span>
              ))}
            </div>
          </div>

          {/* 表格檢視：不依賴顏色也能讀到所有數字 */}
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-slate-500 hover:text-slate-700">查看數字表格</summary>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-right">
                <thead className="text-xs text-slate-500">
                  <tr>
                    <th className="py-1.5 text-left font-medium">月份</th>
                    <th className="py-1.5 font-medium">收入</th>
                    <th className="py-1.5 font-medium">支出</th>
                    <th className="py-1.5 font-medium">結餘</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {trend.map((t) => (
                    <tr key={t.month}>
                      <td className="py-1.5 text-left">{formatShortMonth(t.month)}</td>
                      <td className="py-1.5">{money.format(t.income)}</td>
                      <td className="py-1.5">{money.format(t.expense)}</td>
                      <td className="py-1.5">{money.format(t.income - t.expense)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </div>
  );
}
