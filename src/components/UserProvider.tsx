"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CurrentUser = { id: string; name: string; email: string };

const UserContext = createContext<CurrentUser | null>(null);

// 會員頁面共用：載入一次目前登入者，提供給底下所有元件使用
export function UserProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        if (!cancelled && res.ok) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) router.replace("/login");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-slate-500">
        載入中…
      </div>
    );
  }

  return <UserContext value={user}>{children}</UserContext>;
}

export function useUser() {
  const user = useContext(UserContext);
  if (!user) throw new Error("useUser 必須在 UserProvider 裡面使用");
  return user;
}
