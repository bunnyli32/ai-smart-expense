"use client";

import { useState, type FormEvent } from "react";
import { TYPE_LABELS, categoriesFor, type TransactionType } from "@/lib/categories";
import type { TransactionDTO } from "@/lib/transactions";

type Props = {
  // 有傳入 initial 代表「編輯」，否則是「新增」
  initial: TransactionDTO | null;
  defaultDate: string;
  onClose: () => void;
  onSaved: () => void;
};

const inputClass =
  "mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

export default function TransactionForm({ initial, defaultDate, onClose, onSaved }: Props) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
  const [category, setCategory] = useState(initial?.category ?? categoriesFor("expense")[0]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function changeType(next: TransactionType) {
    setType(next);
    // 切換收入或支出時，分類改成該類型的第一個選項
    if (!categoriesFor(next).includes(category)) setCategory(categoriesFor(next)[0]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const form = new FormData(event.currentTarget);
    const body = {
      type,
      category,
      amount: Number(form.get("amount")),
      date: String(form.get("date")),
      note: String(form.get("note") ?? ""),
    };

    try {
      const res = await fetch(initial ? `/api/transactions/${initial.id}` : "/api/transactions", {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "儲存失敗，請稍後再試");
        setSaving(false);
        return;
      }
      onSaved();
    } catch {
      setError("網路連線失敗，請稍後再試");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-form-title"
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:max-w-md sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="transaction-form-title" className="text-lg font-bold text-slate-900">
            {initial ? "編輯紀錄" : "新增紀錄"}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="關閉">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* 收入／支出切換 */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => changeType(t)}
                aria-pressed={type === t}
                className={`rounded-lg py-2 text-sm font-semibold transition ${
                  type === t ? (t === "expense" ? "bg-white text-rose-600 shadow-sm" : "bg-white text-emerald-600 shadow-sm") : "text-slate-500"
                }`}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">金額</span>
            <input
              name="amount"
              type="number"
              inputMode="decimal"
              required
              min="0.01"
              step="0.01"
              defaultValue={initial?.amount}
              placeholder="0"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">分類</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              {categoriesFor(type).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">日期</span>
            <input name="date" type="date" required defaultValue={initial?.date ?? defaultDate} className={inputClass} />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">備註（選填）</span>
            <input name="note" type="text" maxLength={200} defaultValue={initial?.note} placeholder="例如：午餐便當" className={inputClass} />
          </label>

          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 py-3 font-semibold text-slate-700 hover:bg-slate-50">
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-600 py-3 font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "儲存中…" : "儲存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
