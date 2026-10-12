type DiamondProps = {
  className?: string;
};

export function Diamond({ className = "" }: DiamondProps) {
  return (
    <span
      aria-hidden
      className={`inline-block size-1.5 shrink-0 rotate-45 bg-gold ${className}`.trim()}
    />
  );
}
