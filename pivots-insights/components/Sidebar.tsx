"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/mercado", label: "Mercado" },
  { href: "/contratos", label: "Contratos" },
  { href: "/financeiro", label: "Financeiro" },
  { href: "/regioes", label: "Regiões" },
  { href: "/tendencias", label: "Tendências" },
  { href: "/rankings", label: "Rankings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-60 shrink-0 flex-col border-r border-line px-4 py-6 gap-1">
      <div className="px-2 pb-6">
        <span className="text-sm font-medium tracking-wide text-ink">Pivots</span>
        <span className="text-sm font-medium tracking-wide text-muted"> Insights</span>
      </div>
      <nav className="flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "bg-white/[0.06] text-ink" : "text-muted hover:text-ink hover:bg-white/[0.03]",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
