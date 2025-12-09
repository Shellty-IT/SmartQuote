// src/app/dashboard/layout.tsx

'use client';

import { useEffect, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { Menu, X } from "lucide-react";
import clsx from "clsx";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Lock background scroll when the mobile sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      // focus the close button for accessibility
      const id = window.setTimeout(() => closeBtnRef.current?.focus(), 0);

      // close on Escape
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsSidebarOpen(false);
      };
      document.addEventListener("keydown", onKeyDown);

      return () => {
        window.clearTimeout(id);
        document.body.style.overflow = previousOverflow;
        document.removeEventListener("keydown", onKeyDown);
      };
    }
  }, [isSidebarOpen]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Overlay dla wersji mobilnej (tło po otwarciu menu) */}
      <div
        className={clsx(
          "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden={!isSidebarOpen}
        role="presentation"
      />

      {/* Kontener Sidebar - obsługuje animację wjazdu na mobile i stałą pozycję na desktopie */}
      <div
        id="mobile-sidebar"
        className={clsx(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white transition-transform duration-300 md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Nawigacja"
        aria-hidden={!isSidebarOpen}
      >
        <div className="relative h-full flex flex-col">
          {/* Przycisk zamknięcia tylko na mobile */}
          <div className="absolute top-2 right-2 md:hidden z-50">
            <button
              ref={closeBtnRef}
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"
              aria-label="Zamknij nawigację"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Renderowanie oryginalnego Sidebara */}
          <Sidebar />
        </div>
      </div>

      {/* Główna sekcja treści */}
      <div className="md:pl-64 transition-all duration-300 flex flex-col min-h-screen">
        
        {/* Pasek nawigacji mobilnej (widoczny tylko na małych ekranach) */}
        <div className="sticky top-0 z-30 flex items-center justify-between bg-white px-4 py-3 shadow-sm md:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-600 focus:outline-none hover:bg-gray-100 p-1 rounded-md"
            aria-haspopup="dialog"
            aria-controls="mobile-sidebar"
            aria-expanded={isSidebarOpen}
            aria-label="Otwórz nawigację"
          >
            <Menu size={24} />
          </button>
          <span className="font-semibold text-gray-800">Menu</span>
          {/* Pusty element dla zachowania równowagi flex lub np. logo */}
          <div className="w-8" /> 
        </div>

        {/* Oryginalny Header - ukrywamy go na mobile jeśli dubluje funkcje, 
            lub zostawiamy jeśli zawiera ważne elementy (jak profil użytkownika). 
            Tutaj zakładam, że na desktopie jest potrzebny. */}
        <div className="hidden md:block">
            <Header />
        </div>

        <main className="flex-1 overflow-x-hidden p-4 md:p-6">
            {children}
        </main>
      </div>
    </div>
  );
}