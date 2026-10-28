import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "شاخ | گەیاندنی خواردن و کڕینی ڕۆژانە",
  description: "لە شاخەوە خواردن، سوپەرمارکێت، سەوزە و میوە بە ئاسانی داوا بکە.",
  applicationName: "Shakh Delivery",
  metadataBase: new URL("https://daim-post.online"),
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#17633a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ckb" dir="rtl"><body>{children}</body></html>;
}
