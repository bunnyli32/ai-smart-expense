import Link from "next/link";

const features = [
  {
    title: "智慧記帳",
    description: "幾秒鐘就能記下一筆收入或支出，選擇分類、填寫備註，隨時新增、修改或刪除，紀錄清楚不遺漏。",
    icon: "M12 4v16m8-8H4",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "消費統計",
    description: "自動依餐飲、交通、購物等分類加總，用圓餅圖與趨勢圖一眼看懂錢花到哪裡、每月結餘多少。",
    icon: "M11 3.05A9 9 0 1 0 20.95 13H11V3.05ZM15 3.5A9 9 0 0 1 20.5 9H15V3.5Z",
    color: "bg-sky-50 text-sky-600",
  },
  {
    title: "AI 財務分析",
    description: "AI 根據你的消費習慣找出可以改善的地方，提供專屬於你的個人化理財建議，讓存錢更有方向。",
    icon: "M9.8 15.9 9 18.75l-.8-2.85a4.5 4.5 0 0 0-3.1-3.1L2.25 12l2.85-.8a4.5 4.5 0 0 0 3.1-3.1L9 5.25l.8 2.85a4.5 4.5 0 0 0 3.1 3.1l2.85.8-2.85.8a4.5 4.5 0 0 0-3.1 3.1ZM18.26 8.72 18 9.75l-.26-1.03a3.38 3.38 0 0 0-2.46-2.46L14.25 6l1.03-.26a3.38 3.38 0 0 0 2.46-2.46L18 2.25l.26 1.03a3.38 3.38 0 0 0 2.46 2.46l1.03.26-1.03.26a3.38 3.38 0 0 0-2.46 2.46Z",
    color: "bg-violet-50 text-violet-600",
  },
];

const steps = [
  { title: "免費註冊", description: "用 Email 建立專屬帳號，資料只有你自己看得到。" },
  { title: "記錄收支", description: "每天花一分鐘，記下收入與支出。" },
  { title: "獲得建議", description: "查看統計圖表，讓 AI 幫你分析並給出理財建議。" },
];

// 首頁右側的儀表板示意圖使用的範例資料
const sampleCategories = [
  { name: "餐飲", percent: 38, color: "bg-emerald-500" },
  { name: "交通", percent: 22, color: "bg-sky-500" },
  { name: "購物", percent: 18, color: "bg-violet-500" },
  { name: "娛樂", percent: 12, color: "bg-amber-500" },
];

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-emerald-200/60 to-sky-200/60 blur-2xl" />
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">2026 年 10 月</p>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">範例畫面</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">收入</p>
            <p className="mt-1 text-sm font-bold text-emerald-600 sm:text-base">$52,000</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">支出</p>
            <p className="mt-1 text-sm font-bold text-rose-500 sm:text-base">$31,450</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">結餘</p>
            <p className="mt-1 text-sm font-bold text-slate-900 sm:text-base">$20,550</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {sampleCategories.map((c) => (
            <div key={c.name}>
              <div className="flex justify-between text-xs text-slate-600">
                <span>{c.name}</span>
                <span>{c.percent}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-slate-100">
                <div className={`h-2 rounded-full ${c.color}`} style={{ width: `${c.percent}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-violet-100 bg-violet-50 p-4">
          <p className="text-xs font-semibold text-violet-700">AI 理財建議</p>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            本月餐飲支出比上月增加 15%，建議每週安排 2 天自己帶便當，每月約可省下 $1,800。
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* 主視覺區：產品介紹 */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              結合 AI 的個人財務管理工具
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              聰明記帳，
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">讓每一塊錢都有方向</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg lg:mx-0">
              AI 智慧記帳幫你輕鬆記錄每一筆收入與支出，自動整理消費分類統計，
              再由 AI 分析你的消費習慣，提供量身打造的理財建議。
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/register"
                className="rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
              >
                開始使用
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                我已經有帳號，登入
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">免費使用．不需信用卡．資料加密保護</p>
          </div>

          <DashboardPreview />
        </div>
      </section>

      {/* 三大功能 */}
      <section id="features" className="scroll-mt-16 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-emerald-600">三大功能</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">理財需要的，一次到位</h2>
            <p className="mt-4 text-slate-600">從記錄、統計到分析，陪你一步步養成好的理財習慣。</p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${f.color}`}>
                  <Icon path={f.icon} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 使用流程 */}
      <section id="how-it-works" className="scroll-mt-16 bg-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-emerald-600">使用流程</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">三個步驟，輕鬆上手</h2>
          </div>

          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-2xl bg-slate-50 p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-base font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{s.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 安全保障 */}
      <section id="security" className="scroll-mt-16 py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-3">
          <div className="md:col-span-3 text-center">
            <p className="text-sm font-semibold text-emerald-600">安全保障</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">你的財務資料，只屬於你</h2>
          </div>
          {[
            ["密碼加密儲存", "密碼經過雜湊加密處理，連系統管理者也無法得知。"],
            ["個人資料隔離", "每位會員只能存取自己的記帳資料。"],
            ["隱私優先的 AI", "只提供統計摘要給 AI 分析，不傳送你的備註內容。"],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 行動呼籲 */}
      <section className="px-4 pb-16 sm:px-6 md:pb-24">
        <div className="mx-auto max-w-6xl rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 px-6 py-12 text-center text-white sm:px-12 md:py-16">
          <h2 className="text-2xl font-bold sm:text-3xl">今天就開始掌握你的財務狀況</h2>
          <p className="mx-auto mt-4 max-w-xl text-emerald-50">只要一分鐘註冊，立即體驗 AI 帶來的聰明理財方式。</p>
          <Link
            href="/register"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-3 font-semibold text-emerald-700 shadow-lg transition hover:bg-emerald-50"
          >
            開始使用
          </Link>
        </div>
      </section>
    </>
  );
}
