"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { WhoAmIBadge } from "./who-am-i";

const NAV_ITEMS = [
  { href: "/", label: "Sommaire", emoji: "🏕️" },
  { href: "/participants", label: "Participants", emoji: "👥" },
  { href: "/lifts", label: "Lifts", emoji: "🚗" },
  { href: "/canots", label: "Canots", emoji: "🛶" },
  { href: "/stock-perso", label: "Stock perso", emoji: "🎒" },
  { href: "/stock-commun", label: "Stock commun", emoji: "📦" },
  { href: "/menu", label: "Menu", emoji: "🍽️" },
  { href: "/epicerie", label: "Épicerie", emoji: "🛒" },
  { href: "/boissons", label: "Boissons", emoji: "🍻" },
  { href: "/plan-action", label: "Plan", emoji: "✅" },
];

export function Nav({ tripName }: { tripName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close drawer when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const current = NAV_ITEMS.find((i) => i.href === pathname) ?? NAV_ITEMS[0];

  return (
    <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
      {/* Top bar */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Mobile: burger + current page */}
        <button
          onClick={() => setOpen(true)}
          className="md:hidden flex items-center gap-2 -ml-1 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition"
          aria-label="Ouvrir le menu"
        >
          <Burger />
          <span className="font-semibold text-base">
            <span>{current.emoji}</span> <span>{current.label}</span>
          </span>
        </button>
        {/* Desktop: trip name */}
        <Link href="/" className="hidden md:flex font-semibold text-lg items-center gap-2 truncate">
          <span>🛶</span>
          <span className="truncate">{tripName}</span>
        </Link>

        <WhoAmIBadge />
      </div>

      {/* Desktop horizontal tabs */}
      <nav className="hidden md:block max-w-6xl mx-auto px-2 overflow-x-auto scrollbar-thin">
        <ul className="flex gap-1 min-w-max">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-foreground"
                  }`}
                >
                  {item.emoji} {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="md:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
          />
          <aside className="md:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-card shadow-xl flex flex-col">
            <div className="px-4 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="text-xl">🛶</div>
                <div className="font-bold text-sm leading-tight">{tripName}</div>
              </div>
              <button onClick={() => setOpen(false)} className="text-2xl leading-none text-muted hover:text-foreground" aria-label="Fermer">✕</button>
            </div>
            <ul className="flex-1 overflow-y-auto p-2 space-y-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium transition ${
                        active
                          ? "bg-teal-50 text-primary"
                          : "text-foreground hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-xl">{item.emoji}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>
        </>
      )}
    </header>
  );
}

function Burger() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="4" y1="7"  x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}
