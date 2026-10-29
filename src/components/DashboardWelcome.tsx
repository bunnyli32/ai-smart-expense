"use client";

import Link from "next/link";
import { useUser } from "./UserProvider";

export default function DashboardWelcome() {
  const user = useUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">嗨，{user.name} 👋</h1>
        <p className="mt-2 text-slate-600">歡迎來到你的個人記帳儀表板。</p>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="font-semibold text-emerald-800">✅ 登入成功</p>
        <p className="mt-2 text-sm leading-6 text-emerald-900/80">
          目前登入帳號：{user.email}
          <br />
          分類統計與 AI 分析功能將在接下來的階段陸續完成。
        </p>
        <Link
          href="/transactions"
          className="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          前往收支管理
        </Link>
      </div>
    </div>
  );
}
