import MemberHeader from "@/components/MemberHeader";
import { UserProvider } from "@/components/UserProvider";

// 會員頁面共用版面。未登入的訪客會先被 proxy.ts 導向 /login
export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <MemberHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </UserProvider>
  );
}
