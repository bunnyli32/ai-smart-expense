import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = { title: "會員登入" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
