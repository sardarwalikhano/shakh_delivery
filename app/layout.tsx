import type { Metadata, Viewport } from "next";
import "./globals.css";
import InstallPwa from "./install-pwa";
import RegisterServiceWorker from "./register-sw";

export const metadata: Metadata = {
  title: "شاخ | گەیاندنی خواردن و کڕینی ڕۆژانە",
  description: "لە شاخەوە خواردن، سوپەرمارکێت، سەوزە و میوە بە ئاسانی داوا بکە.",
  applicationName: "Shakh Delivery",
  metadataBase: new URL("https://daim-post.online"),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Shakh",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7c3aed",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ckb" dir="rtl"><body>{children}<RegisterServiceWorker /><InstallPwa /></body></html>;
}
