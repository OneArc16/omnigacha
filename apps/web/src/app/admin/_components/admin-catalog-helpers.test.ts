import assert from 'node:assert/strict';
import { test } from 'vitest';
import { formDataWith } from '../../../lib/test-utils';
import {
  catalogStatusVariant,
  getRarityLabel,
  getStatusBadgeText,
  readCatalogBasePayload,
  readOptionalField,
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

test('readCatalogBasePayload trims the name, parses rarity and defaults to draft', () => {
  const payload = readCatalogBasePayload(
    formDataWith({ name: '  Seele  ', rarity: '5', status: '', slug: '' }),
  );

  assert.deepEqual(payload, { name: 'Seele', rarity: 5, status: 'DRAFT' });
});

test('readCatalogBasePayload sends the slug only when it was typed', () => {
  const payload = readCatalogBasePayload(
    formDataWith({ name: 'Seele', rarity: '5', status: 'PUBLISHED', slug: 'seele' }),
  );

  assert.deepEqual(payload, {
    name: 'Seele',
    rarity: 5,
    status: 'PUBLISHED',
    slug: 'seele',
  });
});

test('readCatalogBasePayload validates the required name and the rarity range', () => {
  assert.throws(
    () => readCatalogBasePayload(formDataWith({ name: ' ', rarity: '5' })),
    /Nombre es obligatorio\./,
  );
  assert.throws(
    () => readCatalogBasePayload(formDataWith({ name: 'Seele', rarity: '6' })),
    /Rareza debe ser menor o igual a 5\./,
  );
});

test('readOptionalField yields the field only when it has text', () => {
  assert.deepEqual(readOptionalField(formDataWith({ gameVersion: '3.8' }), 'gameVersion'), {
    gameVersion: '3.8',
  });
  assert.deepEqual(readOptionalField(formDataWith({ gameVersion: '  ' }), 'gameVersion'), {});
});
