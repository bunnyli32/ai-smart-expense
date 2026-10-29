import type { Metadata } from "next";
import TransactionsManager from "@/components/TransactionsManager";

export const metadata: Metadata = { title: "收支管理" };

export default function TransactionsPage() {
  return <TransactionsManager />;
}
