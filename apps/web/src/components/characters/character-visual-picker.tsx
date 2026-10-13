'use client';

import { useMemo, useState } from 'react';
import { Character } from '../../lib/api';
import { Input } from '../ui/input';
import { EmptyState } from '../ui/inset';
import { CharacterTile } from './character-tile';

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
    <div className={`space-y-3 ${className}`.trim()}>
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={searchPlaceholder}
        disabled={disabled}
      />

      {filteredCharacters.length === 0 ? (
        <EmptyState className="py-8 text-center">{emptyText}</EmptyState>
      ) : (
        // Las fichas se reparten solas según el ancho del panel que las contiene.
        <div className="grid max-h-[26rem] grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2 overflow-y-auto p-px pr-1">
          {filteredCharacters.map((character) => (
            <CharacterTile
              key={character.id}
              character={character}
              selected={character.id === value}
              disabled={disabled}
              onClick={() => onValueChange(character.id === value ? null : character.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
