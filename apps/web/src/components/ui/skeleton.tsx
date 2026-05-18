type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={[
        'animate-pulse rounded-lg bg-[var(--surface-elevated)]/80',
        className,
      ].join(' ')}
    />
  );
}
