'use client';

import { useMemo, useState } from 'react';
import { Character } from '../../lib/api';
import { Input } from '../ui/input';
import { CharacterSummaryCard } from './character-summary-card';

type CharacterVisualPickerProps = {
  characters: Character[];
  value: number | null;
  onValueChange: (id: number | null) => void;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function CharacterVisualPicker({
  characters,
  value,
  onValueChange,
  searchPlaceholder = 'Busca por nombre o alias',
  emptyText = 'No hay personajes que coincidan.',
  disabled = false,
  className = '',
}: CharacterVisualPickerProps) {
  const [query, setQuery] = useState('');

  const filteredCharacters = useMemo(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return characters;

    return characters.filter((character) => {
      const searchSource = normalize(
        [character.name, ...character.aliases.map((alias) => alias.alias)].join(' '),
      );
      return searchSource.includes(normalizedQuery);
    });
  }, [characters, query]);

  return (
    <div className={['space-y-3', className].join(' ')}>
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={searchPlaceholder}
        disabled={disabled}
      />

      {filteredCharacters.length === 0 ? (
        <div className="border border-dashed border-[var(--line)] bg-[var(--surface-2)] px-4 py-8 text-center text-sm text-[var(--ink-500)]">
          {emptyText}
        </div>
      ) : (
        <div className="grid max-h-96 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 2xl:grid-cols-3">
          {filteredCharacters.map((character) => (
            <CharacterSummaryCard
              key={character.id}
              character={character}
              size="sm"
              selected={character.id === value}
              onClick={
                disabled
                  ? undefined
                  : () => onValueChange(character.id === value ? null : character.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
