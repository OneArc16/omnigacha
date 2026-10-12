import assert from 'node:assert/strict';
import test from 'node:test';
import {
  catalogStatusVariant,
  getRarityLabel,
  getStatusBadgeText,
} from './admin-catalog-helpers';

test('catalogStatusVariant maps each editorial status to its badge tone', () => {
  assert.equal(catalogStatusVariant('PUBLISHED'), 'success');
  assert.equal(catalogStatusVariant('ARCHIVED'), 'danger');
  assert.equal(catalogStatusVariant('DRAFT'), 'warning');
});

test('getStatusBadgeText renders Spanish labels for each status', () => {
  assert.equal(getStatusBadgeText('PUBLISHED'), 'Publicado');
  assert.equal(getStatusBadgeText('ARCHIVED'), 'Archivado');
  assert.equal(getStatusBadgeText('DRAFT'), 'Borrador');
});

test('getRarityLabel appends a star to the numeric rarity', () => {
  assert.equal(getRarityLabel(5), '5★');
});
