"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { AiMode, AiReportDTO, AiUsage } from "@/lib/aiReport";
import { currentMonth, formatMonth, money } from "@/lib/format";
import { CategoryBars, SummaryTiles } from "./charts";
import MonthSwitcher from "./MonthSwitcher";

type Loaded = { month: string; mode: AiMode; count: number; report: AiReportDTO | null; stale: boolean; usage: AiUsage | null; error: string };

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">{step}</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-relaxed text-slate-700">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const Disclaimer = () => (
  <p className="rounded-xl bg-slate-100 px-4 py-3 text-xs leading-relaxed text-slate-600">
    ⚠️ AI 建議僅供參考，不構成專業財務或投資建議。
  </p>
);

function changeLabel(pct: number) {
  if (pct === 0) return "維持";
  return pct > 0 ? `+${pct}%` : `−${Math.abs(pct)}%`;
}

function Report({ report, stale }: { report: AiReportDTO; stale: boolean }) {
  const { facts, budget } = report;

  return (
    <div className="space-y-6">
      {report.mock && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-relaxed text-sky-900">
          <p className="font-semibold">🧪 這是模擬分析，不是真正的 AI 分析</p>
          <p className="mt-1">內容由系統依你的真實收支統計、以固定規則產生，沒有使用 AI，也不會產生任何費用。</p>
        </div>
      )}

      {report.dataQuality.message && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900" role="note">
          <p className="font-semibold">⚠️ {report.dataQuality.level === "insufficient" ? "資料不足，僅供初步參考" : "缺少歷史資料，僅供參考"}</p>
          <p className="mt-1">{report.dataQuality.message}</p>
        </div>
      )}

      {stale && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          這份報告產生後，記帳資料或分析規則有更新。可以按「重新分析」取得最新的建議。
        </p>
      )}

      <Section step={1} title="本月收支概況">
        <SummaryTiles stats={facts} />
        <p className="mt-4 text-sm leading-relaxed text-slate-700">{report.overview}</p>
      </Section>

      <Section step={2} title="主要支出類別與消費習慣">
        <div className="grid gap-6 lg:grid-cols-2">
          <CategoryBars items={facts.expenseCategories} type="expense" limit={5} />
          <BulletList items={report.habits} />
        </div>
      </Section>

      <Section step={3} title="值得注意的支出情況">
        {report.alerts.length > 0 ? (
          <ul className="space-y-2">
            {report.alerts.map((alert, i) => (
              <li key={i} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
                {alert}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-600">
            {report.dataQuality.level === "insufficient"
              ? "目前紀錄還太少，暫時無法判斷有哪些需要注意的支出。"
              : "這個月沒有特別需要注意的支出，繼續保持！"}
          </p>
        )}
      </Section>

      <Section step={4} title="三項具體改善建議">
        <ol className="grid gap-3 md:grid-cols-3">
          {report.suggestions.map((s, i) => (
            <li key={i} className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-emerald-700">建議 {i + 1}</p>
              <p className="mt-1 font-semibold text-slate-900">{s.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{s.detail}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section step={5} title="下個月預算規劃建議">
        {budget.items.length > 0 ? (
          <>
            <ul className="divide-y divide-slate-100">
              {budget.items.map((item) => (
                <li key={item.category} className="py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex items-center gap-1.5 font-medium text-slate-900">
                      {item.category}
                      {item.basis && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                            item.basis === "history" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {item.basis === "history" ? "歷史推算" : "示範"}
                        </span>
                      )}
                    </span>
                    <span className="text-right text-sm tabular-nums">
                      <span className="text-slate-500">{money.format(item.current)} → </span>
                      <span className="font-semibold text-slate-900">{money.format(item.suggested)}</span>
                      {item.basis !== "demo" && (
                        <span className="ml-1.5 inline-block min-w-12 rounded bg-slate-100 px-1.5 py-0.5 text-center text-xs text-slate-600">
                          {changeLabel(item.changePercent)}
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.reason}</p>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-baseline justify-between border-t border-slate-200 pt-3">
              <span className="font-semibold text-slate-900">建議總預算</span>
              <span className="font-bold tabular-nums text-slate-900">{money.format(budget.total)}</span>
            </div>
            {budget.expectedBalance !== null && (
              <p className="mt-2 text-sm text-slate-600">
                若下個月收入與本月相同（{money.format(facts.income)}），預估可結餘{" "}
                <span className={`font-semibold ${budget.expectedBalance < 0 ? "text-rose-600" : "text-emerald-700"}`}>
                  {money.format(budget.expectedBalance)}
                </span>
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-600">這個月沒有支出紀錄，暫時無法規劃分類預算。</p>
        )}
        <p className="mt-4 text-sm leading-relaxed text-slate-700">{budget.note}</p>
        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          「歷史推算」：本月與上個月都有這個分類的支出，依實際金額推算。「示範」：缺少足夠的歷史資料，以本月實際金額作為起點，僅供示範。所有金額都由系統根據你的記帳資料計算。
        </p>
      </Section>

      <p className="text-center text-xs text-slate-400">
        分析時間：{new Date(report.createdAt).toLocaleString("zh-TW", { dateStyle: "medium", timeStyle: "short" })}．{report.mock ? "模擬分析（固定規則產生，未使用 AI）" : `模型：${report.model}`}
      </p>
    </div>
  );
}

export default function AiAnalysis() {
  const [month, setMonth] = useState(currentMonth);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [notice, setNotice] = useState("");
  // 記住目前顯示的月份，避免分析完成時使用者已切換到別的月份
  const monthRef = useRef(month);

  // 切換月份時讀取該月的資料筆數與上次的報告（不會呼叫 OpenAI）
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ai/analyze?month=${month}`)
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        setLoaded(
          res.ok
            ? { month, mode: data.mode, count: data.count, report: data.report, stale: data.stale, usage: data.usage, error: "" }
            : { month, mode: "ai", count: 0, report: null, stale: false, usage: null, error: data.message ?? "載入失敗" },
        );
      })
      .catch(() => {
        if (!cancelled) setLoaded({ month, mode: "ai", count: 0, report: null, stale: false, usage: null, error: "網路連線失敗，請稍後再試" });
      });
    return () => {
      cancelled = true;
    };
  }, [month]);

  function changeMonth(next: string) {
    monthRef.current = next;
    setMonth(next);
    setGenError("");
    setNotice("");
  }

  async function handleGenerate() {
    const target = month;
    setGenerating(true);
    setGenError("");
    setNotice("");
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: target }),
      });
      const data = await res.json().catch(() => ({}));
      if (monthRef.current !== target) return;
      if (!res.ok) {
        setGenError(data.message ?? "分析失敗，請稍後再試");
        return;
      }
      setLoaded((prev) => prev && { ...prev, report: data.report, stale: false, usage: data.usage });
      if (data.cached) setNotice("記帳資料和上次分析時相同，直接顯示先前的報告（不計入使用次數）。");
    } catch {
      if (monthRef.current === target) setGenError("網路連線失敗，請稍後再試");
    } finally {
      setGenerating(false);
    }
  }

  const loading = !loaded || loaded.month !== month;
  const report = loading ? null : loaded.report;
  const mock = !loading && loaded.mode === "mock";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          AI 財務分析
          {mock && <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800">🧪 模擬模式</span>}
        </h1>
        <p className="mt-1 text-sm text-slate-500">根據你的真實記帳資料，由 AI 整理消費習慣、提供改善建議與下個月預算規劃。</p>
      </div>

      <MonthSwitcher month={month} onChange={changeMonth} />

      {loading ? (
        <p className="py-16 text-center text-sm text-slate-500">載入中…</p>
      ) : loaded.error ? (
        <p className="py-16 text-center text-sm text-rose-600">{loaded.error}</p>
      ) : loaded.count === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-3xl" aria-hidden="true">📝</p>
          <p className="mt-3 font-semibold text-slate-900">{formatMonth(month)}還沒有記帳資料</p>
          <p className="mt-1 text-sm text-slate-500">先記錄幾筆收入或支出，AI 才能根據你的真實資料進行分析。</p>
          <Link href="/transactions" className="mt-5 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
            前往記帳
          </Link>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  {formatMonth(month)}共有 {loaded.count} 筆紀錄
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {mock
                    ? "目前為模擬模式：依你的真實收支統計以固定規則產生報告，不會傳送任何資料給 OpenAI，也不會產生費用。"
                    : "只會將月份、金額與分類的統計傳給 AI，不包含你的姓名、Email 與備註內容。"}
                  {!mock && loaded.usage && `今日已使用 ${loaded.usage.used} / ${loaded.usage.limit} 次。`}
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generating && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
                {generating ? "分析中…" : report ? "重新分析" : mock ? "🧪 產生模擬分析" : "✨ 產生 AI 分析"}
              </button>
            </div>
          </div>

          {generating && (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center" role="status">
              <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-[3px] border-emerald-100 border-t-emerald-600" aria-hidden="true" />
              <p className="mt-4 font-medium text-slate-900">{mock ? "正在產生模擬分析…" : "AI 正在分析你的收支…"}</p>
              <p className="mt-1 text-sm text-slate-500">{mock ? "通常幾秒內就會完成" : "大約需要 10～30 秒，請不要關閉頁面"}</p>
            </div>
          )}

          {genError && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
              {genError}
            </p>
          )}

          {notice && !generating && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

          {report && !generating && <Report report={report} stale={loaded.stale} />}
        </>
      )}

      <Disclaimer />
    </div>
  );
}
