"use client";

import { useEffect } from "react";
import { StoreProvider } from "@/lib/store";
import AppShell from "./AppShell";

export default function App() {
  // Service worker : permet l'ouverture hors-ligne une fois l'app installée.
  useEffect(() => {
    if ("serviceWorker" in navigator && window.location.protocol === "https:") {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }, []);

  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
