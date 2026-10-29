"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "./Logo";

const navLinks = [
  { href: "/#features", label: "功能介紹" },
  { href: "/#how-it-works", label: "使用流程" },
  { href: "/#security", label: "安全保障" },
];

export default function SiteHeader() {
  // 手機版選單是否展開
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        {/* 平板與電腦版導覽列 */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="主要導覽">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-slate-600 transition hover:text-emerald-600">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
            登入
          </Link>
          <Link href="/register" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
            免費註冊
          </Link>
        </div>

        {/* 手機版選單按鈕 */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          aria-label={open ? "關閉選單" : "開啟選單"}
          aria-expanded={open}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6" aria-hidden="true">
            {open ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {/* 手機版展開選單 */}
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 md:hidden">
          <nav className="flex flex-col py-2" aria-label="手機版導覽">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/login" className="rounded-lg border border-slate-300 py-2.5 text-center text-sm font-medium text-slate-700">
              登入
            </Link>
            <Link href="/register" className="rounded-lg bg-emerald-600 py-2.5 text-center text-sm font-semibold text-white">
              免費註冊
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
