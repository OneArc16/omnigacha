import assert from 'node:assert/strict';
import { test } from 'vitest';
import { formDataWith } from '../../../../../lib/test-utils';
import { buildCharacterPayload } from './character-payload';

const VALID_FORM = {
  name: 'Kafka',
  slug: '',
  element: 'Lightning',
  path: 'Nihility',
  role: 'Support-DPS',
  rarity: '5',
  gameVersion: '',
  status: 'PUBLISHED',
  baseHp: '',
  baseAtk: '679',
  baseDef: '',
  baseCritRate: '0.05',
  baseCritDamage: '0.5',
  baseSpeed: '100',
};

test('character payload parses identity, editorial fields and base stats', () => {
  const payload: Record<string, unknown> = buildCharacterPayload(formDataWith(VALID_FORM));

  assert.equal(payload.name, 'Kafka');
  assert.equal(payload.element, 'Lightning');
  assert.equal(payload.path, 'Nihility');
  assert.equal(payload.role, 'Support-DPS');
  assert.equal(payload.rarity, 5);
  assert.equal(payload.status, 'PUBLISHED');
  assert.equal(payload.baseAtk, 679);
  assert.equal(payload.baseCritRate, 0.05);
  assert.equal(payload.baseCritDamage, 0.5);
  assert.equal(payload.baseSpeed, 100);
});

test('character payload leaves optional fields out when blank', () => {
  const payload: Record<string, unknown> = buildCharacterPayload(formDataWith(VALID_FORM));

  assert.equal(payload.baseHp, undefined);
  assert.equal(payload.baseDef, undefined);
  assert.ok(!('slug' in payload));
  assert.ok(!('gameVersion' in payload));
});

test('character payload includes slug and game version when provided', () => {
  const payload: Record<string, unknown> = buildCharacterPayload(
    formDataWith({ ...VALID_FORM, slug: 'kafka', gameVersion: '3.8', baseHp: '1086' }),
  );

  assert.equal(payload.slug, 'kafka');
  assert.equal(payload.gameVersion, '3.8');
  assert.equal(payload.baseHp, 1086);
});

test('character payload requires the classification and the mandatory stats', () => {
  assert.throws(
    () => buildCharacterPayload(formDataWith({ ...VALID_FORM, element: '' })),
    /Elemento es obligatorio\./,
  );
  assert.throws(
    () => buildCharacterPayload(formDataWith({ ...VALID_FORM, baseAtk: '' })),
    /ATK base es obligatorio\./,
  );
});

test('character payload keeps integer stats integer and stats non-negative', () => {
  assert.throws(
    () => buildCharacterPayload(formDataWith({ ...VALID_FORM, baseSpeed: '100.5' })),
    /Velocidad base debe ser un número entero\./,
  );
  assert.throws(
    () => buildCharacterPayload(formDataWith({ ...VALID_FORM, baseCritRate: '-0.1' })),
    /Prob\. CRIT debe ser mayor o igual a 0\./,
  );
});
