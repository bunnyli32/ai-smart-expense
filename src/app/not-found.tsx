import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm font-semibold text-emerald-600">404</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">找不到這個頁面</h1>
      <p className="mt-4 text-slate-600">這個頁面不存在，或是還在建置中，敬請期待。</p>
      <Link href="/" className="mt-8 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700">
        回到首頁
      </Link>
    </main>
  );
}
