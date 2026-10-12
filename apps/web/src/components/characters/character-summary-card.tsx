import { ReactNode } from 'react';
import { Character } from '../../lib/api';
import { Badge } from '../ui/badge';
import { CharacterPortrait } from './character-portrait';

type CharacterSummaryCardProps = {
  character: Character;
  size?: 'sm' | 'md';
  selected?: boolean;
  onClick?: () => void;
  trailing?: ReactNode;
  className?: string;
};

export function CharacterSummaryCard({
  character,
  size = 'md',
  selected = false,
  onClick,
  trailing,
  className = '',
}: CharacterSummaryCardProps) {
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={[
        'flex items-start gap-3 border p-3 text-left transition',
        selected
          ? 'border-[var(--brand-400)] bg-[var(--surface-2)] ring-1 ring-[var(--brand-400)]'
          : 'border-[var(--line)] bg-[var(--surface-2)]/70',
        onClick ? 'hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)]' : '',
        className,
      ].join(' ')}
    >
      <CharacterPortrait character={character} size={size} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="truncate text-sm font-semibold text-[var(--ink-900)]">
          {character.name}
        </p>
        {size === 'sm' ? (
          // En rejillas compactas las etiquetas no caben: se resumen en texto.
          <>
            <p className="truncate text-xs text-muted">
              {character.element} · {character.path}
            </p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-gold">
              {character.role}
            </p>
          </>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="brand">{character.element}</Badge>
            <Badge variant="outline">{character.path}</Badge>
            <Badge variant="neutral">{character.role}</Badge>
          </div>
        )}
        {trailing}
      </div>
    </Wrapper>
  );
}
