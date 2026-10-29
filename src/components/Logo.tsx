import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="AI 智慧記帳 首頁">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V9m6 10V5m6 14v-7m4 7H2" />
        </svg>
      </span>
      <span className="text-lg font-bold tracking-tight text-slate-900">AI 智慧記帳</span>
    </Link>
  );
}
