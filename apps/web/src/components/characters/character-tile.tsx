import Image from 'next/image';
import { buildApiAssetUrl, Character } from '../../lib/api';
import { getInitials } from './character-portrait';
import { getRarityBarClassName } from './rarity-style';

type CharacterTileProps = {
  character: Character;
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

const ABBREVIATION_LENGTH = 3;

/** Marca compacta de elemento o vía sobre el retrato; el nombre completo va en el tooltip. */
function TraitMark({ label, value }: { label: string; value: string }) {
  return (
    <span
      title={`${label}: ${value}`}
      className="border border-white/15 bg-[rgba(7,10,22,.85)] px-1 py-px text-[8px] font-bold uppercase leading-[1.4] tracking-[0.08em] text-ink"
    >
      {value.slice(0, ABBREVIATION_LENGTH)}
    </span>
  );
}

/** Ficha de catálogo: retrato cuadrado, marcas de elemento y vía, barra de rareza y nombre. */
export function CharacterTile({
  character,
  selected = false,
  disabled = false,
  onClick,
}: CharacterTileProps) {
  const portraitSrc = buildApiAssetUrl(character.portraitUrl);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      title={`${character.name} · ${character.element} · ${character.path} · ${character.role}`}
      className={[
        'group flex flex-col border text-center transition',
        'focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-60',
        selected
          ? 'border-gold bg-gold/[0.08] shadow-[0_0_14px_rgba(232,201,135,.28)]'
          : 'border-line-soft surface-inset hover:border-[var(--line-strong)]',
      ].join(' ')}
    >
      <span className="relative block aspect-square w-full overflow-hidden bg-[radial-gradient(circle_at_50%_40%,rgba(180,140,255,.4),transparent_62%),linear-gradient(180deg,#2a2160,#151034)]">
        {portraitSrc ? (
          <Image
            src={portraitSrc}
            alt=""
            fill
            sizes="140px"
            className="object-cover object-top transition duration-200 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-2xl font-extrabold tracking-[0.04em] text-[#e6dcff]">
            {getInitials(character.name)}
          </span>
        )}
        <span className="absolute inset-x-0 bottom-1.5 flex justify-center gap-1">
          <TraitMark label="Vía" value={character.path} />
          <TraitMark label="Elemento" value={character.element} />
        </span>
      </span>

      <span className={`h-1 w-full ${getRarityBarClassName(character.rarity)}`} />

      <span
        className={`w-full truncate px-1.5 py-1.5 text-xs font-semibold ${
          selected ? 'text-gold' : 'text-ink'
        }`}
      >
        {character.name}
      </span>
    </button>
  );
}
