"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WhoAmIBadge } from "./who-am-i";

const NAV_ITEMS = [
  { href: "/", label: "🏕️ Sommaire" },
  { href: "/participants", label: "👥 Participants" },
  { href: "/lifts", label: "🚗 Lifts" },
  { href: "/stock-perso", label: "🎒 Stock perso" },
  { href: "/stock-commun", label: "📦 Stock commun" },
  { href: "/menu", label: "🍽️ Menu" },
  { href: "/epicerie", label: "🛒 Épicerie" },
  { href: "/boissons", label: "🍻 Boissons" },
  { href: "/plan-action", label: "✅ Plan" },
];

export function Nav({ tripName }: { tripName: string }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="font-semibold text-lg flex items-center gap-2 truncate">
          <span>🛶</span>
          <span className="truncate">{tripName}</span>
        </Link>
        <WhoAmIBadge />
      </div>
      <nav className="max-w-6xl mx-auto px-2 overflow-x-auto scrollbar-thin">
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
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
