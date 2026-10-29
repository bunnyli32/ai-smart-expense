import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/jwt";

// 需要登入才能進入的頁面
const PROTECTED_PATHS = ["/dashboard", "/transactions", "/stats", "/ai-analysis"];
// 已登入就不需要再看的頁面
const AUTH_PATHS = ["/login", "/register"];

// 注意：這裡只是「頁面導向」的第一道把關。
// 真正的資料權限檢查在每支 API 裡（requireUser），不能只靠 proxy。
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userId = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  const isProtected = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (AUTH_PATHS.includes(pathname) && userId) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/transactions/:path*", "/stats/:path*", "/ai-analysis/:path*", "/login", "/register"],
};
