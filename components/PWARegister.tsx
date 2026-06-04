"use client";
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
import { useEffect } from "react";

export let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

export default function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => console.log("SW registrado:", reg.scope))
          .catch((err) => console.log("SW error:", err));
      });
    }

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredInstallPrompt = e as BeforeInstallPromptEvent;
      window.dispatchEvent(new Event("pwaInstallReady"));
    });

    window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
      window.dispatchEvent(new Event("pwaInstalled"));
    });
  }, []);

  return null;
}
