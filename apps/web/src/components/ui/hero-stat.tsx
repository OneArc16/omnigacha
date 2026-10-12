import { ReactNode } from "react";

type HeroStatProps = {
  eyebrow: string;
  value: ReactNode;
  unit: string;
  caption: string;
  /** Desglose opcional bajo la cifra (barras, leyendas...). */
  children?: ReactNode;
};

/** Cifra protagonista de un panel, con el anillo decorativo del mockup. */
export function HeroStat({ eyebrow, value, unit, caption, children }: HeroStatProps) {
  return (
    <div className="relative overflow-hidden border border-line-gold bg-[linear-gradient(135deg,rgba(232,201,135,.10),rgba(18,26,58,0)_60%)] px-5 py-[18px]">
      <svg
        aria-hidden
        className="absolute -right-[30px] -top-[30px] opacity-55"
        width="150"
        height="150"
        viewBox="0 0 150 150"
      >
        <circle cx="75" cy="75" r="60" fill="none" stroke="rgba(232,201,135,.25)" />
        <circle
          cx="75"
          cy="75"
          r="44"
          fill="none"
          stroke="rgba(232,201,135,.15)"
          strokeDasharray="3 6"
        />
      </svg>

      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">
        {eyebrow}
      </p>
      <p className="mb-1.5 mt-2 bg-[linear-gradient(180deg,#fff,#cfd6f5)] bg-clip-text text-[58px] font-extrabold leading-none tracking-[-0.02em] text-transparent">
        {value}
        <span className="ml-1.5 text-base font-semibold tracking-normal text-muted">
          {unit}
        </span>
      </p>
      <p className="text-xs text-muted">{caption}</p>

      {children}
    </div>
  );
}
