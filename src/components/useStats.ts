"use client";

import { useEffect, useState } from "react";
import type { StatsDTO } from "@/lib/stats";

type Result = { month: string; stats: StatsDTO | null; error: string };

// 載入某個月的統計資料；切換月份時自動重新載入
export function useStats(month: string) {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/stats?month=${month}`)
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        setResult(res.ok ? { month, stats: data, error: "" } : { month, stats: null, error: data.message ?? "載入失敗" });
      })
      .catch(() => {
        if (!cancelled) setResult({ month, stats: null, error: "網路連線失敗，請稍後再試" });
      });
    return () => {
      cancelled = true;
    };
  }, [month]);

  const loading = !result || result.month !== month;
  return { loading, stats: loading ? null : result.stats, error: loading ? "" : result.error };
}
