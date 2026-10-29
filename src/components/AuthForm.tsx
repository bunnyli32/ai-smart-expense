"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Mode = "login" | "register";

const text = {
  login: {
    title: "歡迎回來",
    subtitle: "登入你的 AI 智慧記帳帳號",
    submit: "登入",
    loading: "登入中…",
    switchText: "還沒有帳號？",
    switchLink: "免費註冊",
    switchHref: "/register",
  },
  register: {
    title: "建立帳號",
    subtitle: "一分鐘註冊，開始聰明記帳",
    submit: "註冊",
    loading: "註冊中…",
    switchText: "已經有帳號了？",
    switchLink: "登入",
    switchHref: "/login",
  },
} as const;

const inputClass =
  "mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const t = text[mode];
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "發生錯誤，請稍後再試");
        setLoading(false);
        return;
      }

      router.replace("/dashboard");
    } catch {
      setError("網路連線失敗，請稍後再試");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 sm:py-24">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{t.subtitle}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {mode === "register" && (
            <label className="block">
              <span className="text-sm font-medium text-slate-700">暱稱</span>
              <input name="name" type="text" required maxLength={50} autoComplete="nickname" placeholder="例如：小明" className={inputClass} />
            </label>
          )}

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" className={inputClass} />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">密碼</span>
            <input
              name="password"
              type="password"
              required
              minLength={mode === "register" ? 8 : undefined}
              maxLength={72}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              placeholder={mode === "register" ? "至少 8 個字元" : "請輸入密碼"}
              className={inputClass}
            />
          </label>

          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? t.loading : t.submit}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {t.switchText}
          <Link href={t.switchHref} className="ml-1 font-semibold text-emerald-600 hover:text-emerald-700">
            {t.switchLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
