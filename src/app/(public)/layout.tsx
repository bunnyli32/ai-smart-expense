import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

// 公開頁面（首頁、登入、註冊）共用的版面：上方導覽列＋下方頁尾
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
