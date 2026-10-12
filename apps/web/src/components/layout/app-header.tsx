"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "../../lib/use-current-user";
import { Diamond } from "../ui/diamond";

const BASE_NAV_ITEMS = [
  { href: "/", label: "Espacio de trabajo" },
  { href: "/simulator", label: "Simulador" },
];
const ADMIN_NAV_ITEM = { href: "/admin", label: "Admin" };

const NAV_LINK_CLASSNAME = "relative px-4 py-[9px] text-[13px] transition";
const NAV_LINK_ACTIVE_CLASSNAME =
  "text-ink after:absolute after:inset-x-4 after:bottom-0.5 after:h-0.5 after:bg-[linear-gradient(90deg,transparent,var(--gold),transparent)]";

function BrandMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
      <rect
        x="5"
        y="5"
        width="24"
        height="24"
        transform="rotate(45 17 17)"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1.5"
      />
      <path
        d="M17 7 L19.2 14.8 L27 17 L19.2 19.2 L17 27 L14.8 19.2 L7 17 L14.8 14.8 Z"
        fill="var(--gold)"
      />
    </svg>
  );
}

function isActivePath(pathname: string, href: string) {
  return href === "/"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader() {
  const pathname = usePathname();
  const currentUser = useCurrentUser();
  const navItems =
    currentUser.status === "ready" && currentUser.profile.role === "ADMIN"
      ? [...BASE_NAV_ITEMS, ADMIN_NAV_ITEM]
      : BASE_NAV_ITEMS;

  return (
    <header className="sticky top-0 z-50 border-b border-line-soft bg-[linear-gradient(180deg,rgba(7,10,22,.9),rgba(7,10,22,.6))] backdrop-blur-xl">
      <div className="flex min-h-[59px] w-full flex-wrap items-center justify-between gap-x-6 px-4 sm:px-6 xl:px-10">
        <Link
          href="/"
          className="flex items-center gap-3 text-sm font-semibold tracking-[0.02em] text-ink"
        >
          <BrandMark />
          <span>
            <small className="mb-0.5 block text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">
              OmniGacha
            </small>
            Centro de control
          </span>
        </Link>

        <nav className="flex items-center gap-1.5" aria-label="Principal">
          {navItems.map((item) => {
            const isActive = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  NAV_LINK_CLASSNAME,
                  isActive
                    ? NAV_LINK_ACTIVE_CLASSNAME
                    : "text-muted hover:text-ink",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
          <Diamond className="mx-2 hidden opacity-50 sm:inline-block" />
          <span className="hidden px-4 py-[9px] text-[13px] text-dim sm:inline">
            MVP activo
          </span>
        </nav>
      </div>
    </header>
  );
}
