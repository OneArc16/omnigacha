import assert from 'node:assert/strict';
import { test } from 'vitest';
import type { Character } from './api';
import {
  buildCharacterStatsFormValues,
  formatCharacterStatChip,
  fromStatInputValue,
  getVisibleCharacterStatKeys,
  toStatInputValue,
} from './character-stats';

function characterWithProfile(
  statProfile: Character['statProfile'],
): Character {
  return { statProfile } as Character;
}

test('percent stats are stored as ratios but edited as percentages', () => {
  assert.equal(toStatInputValue('crit_rate', 0.755), '75.5');
  assert.equal(fromStatInputValue('crit_rate', '75.5'), 0.755);
});

test('flat stats are rounded to integers in both directions', () => {
  assert.equal(toStatInputValue('atk', 3200.4), '3200');
  assert.equal(fromStatInputValue('atk', '3200.6'), 3201);
});

test('fromStatInputValue rejects blank and non-numeric input', () => {
  assert.equal(fromStatInputValue('atk', '   '), null);
  assert.equal(fromStatInputValue('atk', 'abc'), null);
});

test('toStatInputValue leaves missing stats empty', () => {
  assert.equal(toStatInputValue('speed', undefined), '');
});

test('buildCharacterStatsFormValues fills every stat key, blank when absent', () => {
  const values = buildCharacterStatsFormValues({ atk: 2800, crit_rate: 0.5 });

  assert.equal(values.atk, '2800');
  assert.equal(values.crit_rate, '50');
  assert.equal(values.hp, '');
});

test('getVisibleCharacterStatKeys puts prioritized stats first without duplicates', () => {
  const character = characterWithProfile({
    prioritizedStatKeys: ['atk', 'speed'],
    enabledStatKeys: ['speed', 'hp'],
  });

  assert.deepEqual(getVisibleCharacterStatKeys(character), ['atk', 'speed', 'hp']);
});

test('getVisibleCharacterStatKeys falls back to the core offensive stats', () => {
  const fallback = ['atk', 'crit_rate', 'crit_damage', 'speed'];

  assert.deepEqual(getVisibleCharacterStatKeys(null), fallback);
  assert.deepEqual(
    getVisibleCharacterStatKeys(
      characterWithProfile({ prioritizedStatKeys: [], enabledStatKeys: [] }),
    ),
    fallback,
  );
});

test('formatCharacterStatChip labels the value and marks missing stats', () => {
  assert.equal(formatCharacterStatChip('crit_rate', 0.05), 'Prob. crítico (%): 5%');
  assert.equal(formatCharacterStatChip('atk', undefined), 'Ataque: -');
});
