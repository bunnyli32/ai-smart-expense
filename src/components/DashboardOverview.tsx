"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { currentMonth, formatDate, formatMonth, money } from "@/lib/format";
import type { TransactionDTO } from "@/lib/transactions";
import { CategoryBars, SummaryTiles } from "./charts";
import { useStats } from "./useStats";
import { useUser } from "./UserProvider";

type RecentResult = { transactions: TransactionDTO[]; error: string };

export default function DashboardOverview() {
  const user = useUser();
  const [month] = useState(currentMonth);
  const { loading, stats, error } = useStats(month);
  const [recent, setRecent] = useState<RecentResult | null>(null);

  // 最近 5 筆紀錄（不限月份）
  useEffect(() => {
    let cancelled = false;
    fetch("/api/transactions?limit=5")
      .then(async (res) => {
        const data = await res.json();
        if (!cancelled) setRecent(res.ok ? { transactions: data.transactions, error: "" } : { transactions: [], error: data.message ?? "載入失敗" });
      })
      .catch(() => {
        if (!cancelled) setRecent({ transactions: [], error: "網路連線失敗，請稍後再試" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">嗨，{user.name} 👋</h1>
          <p className="mt-1 text-sm text-slate-500">{formatMonth(month)}的財務概況</p>
        </div>
        <Link
          href="/transactions"
          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-5 w-5" aria-hidden="true">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          記一筆
        </Link>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">載入中…</p>
      ) : error || !stats ? (
        <p className="py-10 text-center text-sm text-rose-600">{error || "載入失敗"}</p>
      ) : (
        <SummaryTiles stats={stats} />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">本月支出前 5 名</h2>
            <Link href="/stats" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
              完整統計 →
            </Link>
          </div>
          <div className="mt-4">
            {stats ? (
              <CategoryBars items={stats.categories.expense} type="expense" limit={5} />
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">{loading ? "載入中…" : "無法載入統計資料"}</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">最近紀錄</h2>
            <Link href="/transactions" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
              全部紀錄 →
            </Link>
          </div>
          {!recent ? (
            <p className="py-8 text-center text-sm text-slate-500">載入中…</p>
          ) : recent.error ? (
            <p className="py-8 text-center text-sm text-rose-600">{recent.error}</p>
          ) : recent.transactions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500">還沒有任何紀錄</p>
              <Link href="/transactions" className="mt-2 inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                ＋ 新增第一筆
              </Link>
            </div>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100">
              {recent.transactions.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{t.note || t.category}</p>
                    <p className="text-xs text-slate-500">
                      {formatDate(t.date)}．{t.category}
                    </p>
                  </div>
                  <p className={`shrink-0 text-sm font-semibold ${t.type === "income" ? "text-emerald-600" : "text-rose-500"}`}>
                    {t.type === "income" ? "+" : "−"}
                    {money.format(t.amount)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
