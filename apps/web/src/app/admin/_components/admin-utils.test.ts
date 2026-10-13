import assert from 'node:assert/strict';
import { test } from 'vitest';
import { formatDateTime, matchesQuery, normalizeText, upsertById } from './admin-utils';

test('normalizeText strips accents, case and surrounding whitespace', () => {
  assert.equal(normalizeText('  María JOSÉ  '), 'maria jose');
});

test('matchesQuery matches accent-insensitively across any source field', () => {
  assert.ok(matchesQuery(['Seele', 'seele@omnigacha.io', 'ADMIN'], 'seele'));
  assert.ok(matchesQuery(['Él Niño'], 'el nino'));
  assert.ok(!matchesQuery(['Seele'], 'kafka'));
});

test('matchesQuery treats an empty query as matching everything', () => {
  assert.ok(matchesQuery(['anything'], ''));
  assert.ok(matchesQuery(['anything'], '   '));
});

test('upsertById replaces an existing record and keeps ids sorted ascending', () => {
  const items = [
    { id: 2, name: 'b' },
    { id: 1, name: 'a' },
  ];

  const next = upsertById(items, { id: 1, name: 'a-updated' });

  assert.deepEqual(next, [
    { id: 1, name: 'a-updated' },
    { id: 2, name: 'b' },
  ]);
});

test('upsertById inserts a new record when the id is not present', () => {
  const next = upsertById([{ id: 1, name: 'a' }], { id: 3, name: 'c' });

  assert.deepEqual(next, [
    { id: 1, name: 'a' },
    { id: 3, name: 'c' },
  ]);
});

test('formatDateTime falls back for missing values', () => {
  assert.equal(formatDateTime(undefined), 'sin fecha');
});
