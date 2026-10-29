"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function InstallPwa() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone) {
      setInstalled(true);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden || installed) return null;

  async function install() {
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") setPromptEvent(null);
      return;
    }
    setShowIosHelp((value) => !value);
  }

  return (
    <aside className="fixed bottom-3 left-3 right-3 z-[60] mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-violet-200 bg-white/95 p-3 shadow-2xl backdrop-blur">
      <img src="/icon.svg" alt="" className="h-12 w-12 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="font-bold text-violet-950">Shakh Delivery</p>
        <p className="text-xs text-violet-800">دامەزراندن لەسەر مۆبایل، تابلێت و لاپتۆپ</p>
        {showIosHelp && <p className="mt-1 text-xs leading-5 text-violet-900">لە Safari: دوگمەی Share دابگرە، پاشان Add to Home Screen هەڵبژێرە.</p>}
      </div>
      <button onClick={install} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700">
        <Download size={17} />
        دابمەزرێنە
      </button>
      <button aria-label="داخستن" onClick={() => setHidden(true)} className="rounded-lg p-2 text-violet-700 hover:bg-violet-50">
        <X size={17} />
      </button>
    </aside>
  );
}
