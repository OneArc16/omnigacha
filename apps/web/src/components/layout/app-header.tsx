"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Espacio de trabajo" },
  { href: "/simulator", label: "Simulador" },
  { href: "/admin", label: "Admin" },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--bg)_78%,transparent)] backdrop-blur-xl">
      <div className="flex w-full flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 xl:px-10 2xl:px-12">
        <div className="min-w-0">
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--surface)]/70 px-4 py-2 text-sm font-semibold text-[var(--ink-900)] transition hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)]"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--brand-500),#31d1f6)] text-sm font-black text-slate-950">
              OG
            </span>
            <span className="truncate">Centro de control OmniGacha</span>
          </Link>
        </div>

        <nav className="flex flex-wrap items-center gap-2 sm:ml-auto" aria-label="Principal">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  isActive
                    ? "bg-[var(--surface-elevated)] text-[var(--ink-900)] shadow-[inset_0_0_0_1px_var(--line-strong)]"
                    : "text-[var(--ink-600)] hover:bg-[var(--surface)] hover:text-[var(--ink-900)]",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
