import Image from 'next/image';
import { buildApiAssetUrl, Character } from '../../lib/api';

type PortraitCharacter = Pick<Character, 'name' | 'element' | 'portraitUrl'>;

type CharacterPortraitProps = {
  character?: PortraitCharacter | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const SIZE_CLASSNAME: Record<NonNullable<CharacterPortraitProps['size']>, string> = {
  sm: 'w-12',
  md: 'w-20',
  lg: 'w-32',
};

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function CharacterPortrait({
  character,
  size = 'md',
  className = '',
}: CharacterPortraitProps) {
  const resolvedSrc = buildApiAssetUrl(character?.portraitUrl);

  return (
    <div
      className={[
        'relative aspect-[3/4] shrink-0 overflow-hidden rounded-2xl border border-[var(--line)]',
        SIZE_CLASSNAME[size],
        className,
      ].join(' ')}
    >
      {resolvedSrc ? (
        <Image
          src={resolvedSrc}
          alt={character?.name ?? 'Personaje'}
          fill
          sizes="128px"
          className="object-cover"
          unoptimized
        />
      ) : size === 'sm' ? (
        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(160deg,color-mix(in_oklab,var(--brand-500)_20%,transparent),var(--surface-2))]">
          <span className="text-sm font-black text-[var(--ink-700)]">
            {character ? getInitials(character.name) : '?'}
          </span>
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-between bg-[linear-gradient(160deg,color-mix(in_oklab,var(--brand-500)_20%,transparent),var(--surface-2))] p-1.5 text-center">
          <span className="mt-1 line-clamp-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-500)]">
            {character?.element ?? ''}
          </span>
          <span className="text-lg font-black text-[var(--ink-700)]">
            {character ? getInitials(character.name) : '?'}
          </span>
          <span className="mb-0.5 line-clamp-2 text-[10px] font-medium leading-tight text-[var(--ink-600)]">
            {character?.name ?? 'Sin datos'}
          </span>
        </div>
      )}
    </div>
  );
}
