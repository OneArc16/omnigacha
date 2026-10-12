import Link from "next/link";
import {
  formatTabIndex,
  getTabClassName,
  getTabIndexClassName,
  TAB_HINT_CLASSNAME,
  TAB_LIST_CLASSNAME,
} from "./tab-styles";

type NavTabItem = {
  href: string;
  label: string;
  description?: string;
};

type NavTabsProps = {
  items: NavTabItem[];
  activeHref: string | null;
  label: string;
};

/** Pestañas numeradas que navegan entre rutas en lugar de cambiar estado local. */
export function NavTabs({ items, activeHref, label }: NavTabsProps) {
  const activeItem = items.find((item) => item.href === activeHref);

  return (
    <nav aria-label={label} className={TAB_LIST_CLASSNAME}>
      {items.map((item, index) => {
        const isActive = item.href === activeHref;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={getTabClassName(isActive)}
          >
            <span className={getTabIndexClassName(isActive)}>
              {formatTabIndex(index)}
            </span>
            {item.label}
          </Link>
        );
      })}

      {activeItem?.description ? (
        <p className={TAB_HINT_CLASSNAME}>
          {activeItem.label} · {activeItem.description}
        </p>
      ) : null}
    </nav>
  );
}
