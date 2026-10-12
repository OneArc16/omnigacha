import Image from 'next/image';
import { buildApiAssetUrl } from '../../../lib/api';

type CatalogThumbProps = {
  src?: string | null;
  alt: string;
  placeholder: string;
};

export function CatalogThumb({ src, alt, placeholder }: CatalogThumbProps) {
  const resolvedSrc = buildApiAssetUrl(src);

  if (!resolvedSrc) {
    return (
      <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--line)] bg-[linear-gradient(160deg,color-mix(in_oklab,var(--brand-500)_20%,transparent),var(--surface-2))] px-2 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-500)]">
        {placeholder}
      </div>
    );
  }

  return (
    <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-2xl border border-[var(--line)]">
      <Image
        src={resolvedSrc}
        alt={alt}
        fill
        sizes="56px"
        className="object-cover"
        unoptimized
      />
    </div>
  );
}
