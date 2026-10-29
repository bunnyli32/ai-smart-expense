"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "./Logo";
import { useUser } from "./UserProvider";

// ready 為 false 的頁面會在之後的階段完成，先顯示「即將推出」
const memberLinks = [
  { href: "/dashboard", label: "儀表板", ready: true },
  { href: "/transactions", label: "收支管理", ready: false },
  { href: "/stats", label: "分類統計", ready: false },
  { href: "/ai-analysis", label: "AI 分析", ready: false },
];

export default function MemberHeader() {
  const user = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-600 sm:inline">嗨，{user.name}</span>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {loggingOut ? "登出中…" : "登出"}
          </button>
        </div>
      </div>

      {/* 會員功能導覽：手機上可左右滑動 */}
      <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6" aria-label="會員功能">
        {memberLinks.map((link) =>
          link.ready ? (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === link.href ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {link.label}
            </Link>
          ) : (
            <span key={link.href} className="flex items-center gap-1 whitespace-nowrap px-3 py-2 text-sm text-slate-400" title="之後的階段開放">
              {link.label}
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px]">即將推出</span>
            </span>
          ),
        )}
      </nav>
    </header>
  );
}
