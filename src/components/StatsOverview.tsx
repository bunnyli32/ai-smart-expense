"use client";

import { useState } from "react";
import { currentMonth } from "@/lib/format";
import { CategoryBars, SummaryTiles, TrendChart } from "./charts";
import MonthSwitcher from "./MonthSwitcher";
import { useStats } from "./useStats";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function StatsOverview() {
  const [month, setMonth] = useState(currentMonth);
  const { loading, stats, error } = useStats(month);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">分類統計</h1>
        <p className="mt-1 text-sm text-slate-500">看看錢都花到哪裡去了，以及近半年的收支變化。</p>
      </div>

      <MonthSwitcher month={month} onChange={setMonth} />

      {loading ? (
        <p className="py-16 text-center text-sm text-slate-500">載入中…</p>
      ) : error || !stats ? (
        <p className="py-16 text-center text-sm text-rose-600">{error || "載入失敗"}</p>
      ) : (
        <>
          <SummaryTiles stats={stats} />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="支出分類">
              <CategoryBars items={stats.categories.expense} type="expense" />
            </Card>
            <Card title="收入分類">
              <CategoryBars items={stats.categories.income} type="income" />
            </Card>
          </div>

          <Card title="近 6 個月收支趨勢">
            <TrendChart trend={stats.trend} selectedMonth={month} />
          </Card>
        </>
      )}
    </div>
  );
}
