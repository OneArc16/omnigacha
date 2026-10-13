import { Character } from '../../lib/api';
import { Badge } from '../ui/badge';
import { CharacterPortrait } from './character-portrait';

type CharacterSummaryCardProps = {
  character: Character;
  className?: string;
};

/** Resumen de solo lectura de un personaje ya elegido (p. ej. al editar el roster). */
export function CharacterSummaryCard({
  character,
  className = '',
}: CharacterSummaryCardProps) {
  return (
    <div
      className={`flex items-start gap-3 border border-line-soft surface-inset p-3 ${className}`.trim()}
    >
      <CharacterPortrait character={character} size="md" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="truncate text-sm font-semibold text-ink">{character.name}</p>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="brand">{character.element}</Badge>
          <Badge variant="outline">{character.path}</Badge>
          <Badge variant="neutral">{character.role}</Badge>
        </div>
      </div>
    </div>
  );
}
