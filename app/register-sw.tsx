"use client";

import { useEffect } from "react";

export default function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        void navigator.serviceWorker.register("/sw.js").catch(() => {
          // The web app remains usable if service-worker registration is unavailable.
        });
      }, { once: true });
    }
  }, []);
  return null;
}
