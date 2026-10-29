"use client";

import { useEffect, useState } from "react";
import { TYPE_LABELS, type TransactionType } from "@/lib/categories";
import type { TransactionDTO } from "@/lib/transactions";
import TransactionForm from "./TransactionForm";

type Filter = "all" | TransactionType;

const money = new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", minimumFractionDigits: 0, maximumFractionDigits: 2 });

// 以使用者裝置的當地時間取得今天、本月
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shiftMonth(month: string, diff: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + diff, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(month: string) {
  const [y, m] = month.split("-");
  return `${y} 年 ${Number(m)} 月`;
}

function formatDate(date: string) {
  const [, m, d] = date.split("-");
  return `${Number(m)}/${Number(d)}`;
}

type LoadResult = { month: string; transactions: TransactionDTO[]; error: string };

export default function TransactionsManager() {
  const [month, setMonth] = useState(() => today().slice(0, 7));
  const [filter, setFilter] = useState<Filter>("all");
  const [result, setResult] = useState<LoadResult | null>(null);
  // 新增、修改、刪除後加 1，觸發重新載入
  const [reloadKey, setReloadKey] = useState(0);
  // undefined：表單關閉；null：新增；有值：編輯該筆
  const [editing, setEditing] = useState<TransactionDTO | null | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/transactions?month=${month}`)
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setResult({ month, transactions: [], error: data.message ?? "載入失敗" });
          return;
        }
        setResult({ month, transactions: data.transactions, error: "" });
      })
      .catch(() => {
        if (!cancelled) setResult({ month, transactions: [], error: "網路連線失敗，請稍後再試" });
      });
    return () => {
      cancelled = true;
    };
  }, [month, reloadKey]);

  // 切換月份時，資料還沒回來前顯示載入中
  const loading = !result || result.month !== month;
  const transactions = loading ? [] : result.transactions;
  const visible = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

  const income = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

  async function handleDelete(t: TransactionDTO) {
    const label = `${t.date} ${t.category} ${money.format(t.amount)}`;
    if (!window.confirm(`確定要刪除這筆紀錄嗎？\n${label}`)) return;

    setDeletingId(t.id);
    try {
      const res = await fetch(`/api/transactions/${t.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(data.message ?? "刪除失敗，請稍後再試");
      }
    } catch {
      window.alert("網路連線失敗，請稍後再試");
    }
    setDeletingId(null);
    setReloadKey((k) => k + 1);
  }

  function handleSaved() {
    setEditing(undefined);
    setReloadKey((k) => k + 1);
  }

  // 新增時，預設日期：本月就用今天，其他月份用該月 1 日
  const defaultDate = month === today().slice(0, 7) ? today() : `${month}-01`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">收支管理</h1>
          <p className="mt-1 text-sm text-slate-500">記錄每一筆收入與支出，隨時修改或刪除。</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(null)}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-5 w-5" aria-hidden="true">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          新增紀錄
        </button>
      </div>

      {/* 月份切換 */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-2">
        <button type="button" onClick={() => setMonth(shiftMonth(month, -1))} className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100" aria-label="上個月">
          ‹ 上個月
        </button>
        <label className="relative font-semibold text-slate-900">
          {formatMonth(month)}
          <input
            type="month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="選擇月份"
          />
        </label>
        <button type="button" onClick={() => setMonth(shiftMonth(month, 1))} className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100" aria-label="下個月">
          下個月 ›
        </button>
      </div>

      {/* 本月摘要 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 sm:text-sm">收入</p>
          <p className="mt-1 truncate text-base font-bold text-emerald-600 sm:text-xl">{money.format(income)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 sm:text-sm">支出</p>
          <p className="mt-1 truncate text-base font-bold text-rose-500 sm:text-xl">{money.format(expense)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 sm:text-sm">結餘</p>
          <p className={`mt-1 truncate text-base font-bold sm:text-xl ${income - expense < 0 ? "text-rose-500" : "text-slate-900"}`}>
            {money.format(income - expense)}
          </p>
        </div>
      </div>

      {/* 類型篩選 */}
      <div className="flex gap-2" role="tablist" aria-label="篩選收支類型">
        {(["all", "expense", "income"] as const).map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === f ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {f === "all" ? "全部" : TYPE_LABELS[f]}
          </button>
        ))}
      </div>

      {/* 紀錄列表 */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <p className="py-16 text-center text-sm text-slate-500">載入中…</p>
        ) : result.error ? (
          <p className="py-16 text-center text-sm text-rose-600">{result.error}</p>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-500">{formatMonth(month)}還沒有{filter === "all" ? "" : TYPE_LABELS[filter]}紀錄</p>
            <button type="button" onClick={() => setEditing(null)} className="mt-3 text-sm font-semibold text-emerald-600 hover:text-emerald-700">
              ＋ 新增第一筆
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visible.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
                    t.type === "income" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"
                  }`}
                >
                  {t.category.slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{t.note || t.category}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(t.date)}．{t.category}
                  </p>
                </div>
                <p className={`shrink-0 font-semibold ${t.type === "income" ? "text-emerald-600" : "text-rose-500"}`}>
                  {t.type === "income" ? "+" : "−"}
                  {money.format(t.amount)}
                </p>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => setEditing(t)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="編輯">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.86 4.49 2.65 2.65M4 20l3.5-.8L19.06 7.64a1.87 1.87 0 0 0-2.65-2.65L4.8 16.5 4 20Z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(t)}
                    disabled={deletingId === t.id}
                    className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    aria-label="刪除"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M10 11v6m4-6v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing !== undefined && (
        <TransactionForm initial={editing} defaultDate={defaultDate} onClose={() => setEditing(undefined)} onSaved={handleSaved} />
      )}
    </div>
  );
}
