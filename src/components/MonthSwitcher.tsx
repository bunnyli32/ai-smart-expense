"use client";

import { formatMonth, shiftMonth } from "@/lib/format";

// 月份切換列：上個月／點選月份／下個月
export default function MonthSwitcher({ month, onChange }: { month: string; onChange: (month: string) => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-2">
      <button type="button" onClick={() => onChange(shiftMonth(month, -1))} className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100" aria-label="上個月">
        ‹ 上個月
      </button>
      <label className="relative font-semibold text-slate-900">
        {formatMonth(month)}
        <input
          type="month"
          value={month}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="選擇月份"
        />
      </label>
      <button type="button" onClick={() => onChange(shiftMonth(month, 1))} className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100" aria-label="下個月">
        下個月 ›
      </button>
    </div>
  );
}
