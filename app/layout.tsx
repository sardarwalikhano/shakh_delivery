import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "شاخ | گەیاندنی خواردن و کڕینی ڕۆژانە",
  description: "لە شاخەوە خواردن، سوپەرمارکێت، سەوزە و میوە بە ئاسانی داوا بکە.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ckb" dir="rtl"><body>{children}</body></html>;
}
