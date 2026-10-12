import { ReactNode } from "react";

type FrameFill = "panel" | "strip";

type FrameProps = {
  children: ReactNode;
  fill?: FrameFill;
  className?: string;
  innerClassName?: string;
};

const FILL_CLASSNAME: Record<FrameFill, string> = {
  panel: "surface-panel",
  strip: "surface-strip",
};

// Marco biselado con borde degradado: el contenedor pinta el borde (1px) y
// el interior recorta el relleno con el mismo bisel.
export function Frame({
  children,
  fill = "panel",
  className = "",
  innerClassName = "",
}: FrameProps) {
  return (
    <div className={`surface-frame-edge bevel-14 p-px ${className}`.trim()}>
      <div
        className={`relative h-full bevel-14 ${FILL_CLASSNAME[fill]} ${innerClassName}`.trim()}
      >
        {children}
      </div>
    </div>
  );
}
