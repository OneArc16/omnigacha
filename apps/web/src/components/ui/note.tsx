import { ReactNode } from "react";

type NoteTone = "gold" | "warning";

type NoteProps = {
  children: ReactNode;
  tone?: NoteTone;
  className?: string;
};

const TONE_CLASSNAME: Record<NoteTone, string> = {
  gold: "border-gold-deep bg-gold/[0.04] text-muted",
  warning: "border-warning bg-warning/[0.08] text-warning",
};

/** Nota lateral con filete a la izquierda. */
export function Note({ children, tone = "gold", className = "" }: NoteProps) {
  return (
    <p
      className={`border-l-2 px-3 py-2.5 text-[11.5px] leading-[1.55] ${TONE_CLASSNAME[tone]} ${className}`.trim()}
    >
      {children}
    </p>
  );
}
