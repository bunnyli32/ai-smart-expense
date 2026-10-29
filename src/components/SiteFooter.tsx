import Link from "next/link";
import Logo from "./Logo";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
            記帳不再麻煩。AI 智慧記帳幫你掌握每一筆收支，讓理財變得簡單又有方向。
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">產品</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-500">
            <li><Link href="/#features" className="hover:text-emerald-600">功能介紹</Link></li>
            <li><Link href="/#how-it-works" className="hover:text-emerald-600">使用流程</Link></li>
            <li><Link href="/#security" className="hover:text-emerald-600">安全保障</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">會員</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-500">
            <li><Link href="/login" className="hover:text-emerald-600">會員登入</Link></li>
            <li><Link href="/register" className="hover:text-emerald-600">免費註冊</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-100">
        <p className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-slate-400 sm:px-6">
          © 2026 AI 智慧記帳．Hahow「AI Coding 無痛上手」期末作業
        </p>
      </div>
    </footer>
  );
}
