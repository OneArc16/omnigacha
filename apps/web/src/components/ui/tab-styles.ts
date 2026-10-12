// Estilos comunes de las pestañas numeradas, sean botones (SegmentedTabs)
// o enlaces de navegación (NavTabs).

export const TAB_LIST_CLASSNAME = "flex flex-wrap gap-1 border-b border-line-soft";

export const TAB_HINT_CLASSNAME =
  "ml-auto hidden self-center text-[11px] text-dim md:block";

export function getTabClassName(isActive: boolean) {
  return [
    "relative flex items-center gap-2.5 px-3 pb-3 pt-2.5 text-[13px] transition sm:px-[18px]",
    "focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-gold",
    isActive
      ? "font-semibold text-ink after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-gold after:shadow-[0_0_12px_rgba(232,201,135,.7)]"
      : "text-muted hover:text-ink",
  ].join(" ");
}

export function getTabIndexClassName(isActive: boolean) {
  return [
    "border px-1.5 py-px text-[10px] font-normal tracking-[0.05em]",
    isActive ? "border-gold-deep text-gold" : "border-[#2a3360] text-dim",
  ].join(" ");
}

export function formatTabIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}
