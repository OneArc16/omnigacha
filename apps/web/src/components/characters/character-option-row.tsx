import { Character } from '../../lib/api';
import { CharacterPortrait } from './character-portrait';

type CharacterOptionRowProps = {
  character: Character;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
};

export function CharacterOptionRow({
  character,
  selected = false,
  onClick,
  className = '',
}: CharacterOptionRowProps) {
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={[
        'flex w-full items-center gap-3 border px-2.5 py-2 text-left transition',
        selected
          ? 'border-[var(--brand-400)] bg-[var(--surface-2)] ring-1 ring-[var(--brand-400)]'
          : 'border-[var(--line)] bg-[var(--surface-2)]/70',
        onClick ? 'hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)]' : '',
        className,
      ].join(' ')}
    >
      <CharacterPortrait character={character} size="sm" className="w-8" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--ink-900)]">
          {character.name}
        </p>
        <p className="truncate text-xs text-[var(--ink-500)]">
          {character.element} · {character.path}
        </p>
      </div>
    </Wrapper>
  );
}
