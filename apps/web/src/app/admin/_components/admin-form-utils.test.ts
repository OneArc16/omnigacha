import assert from 'node:assert/strict';
import { test } from 'vitest';
import { formDataWith } from '../../../lib/test-utils';
import {
  readBoolean,
  readNumber,
  readOptionalText,
  readRequiredText,
  readText,
} from './admin-form-utils';

test('readText trims whitespace and returns empty string for missing fields', () => {
  assert.equal(readText(formDataWith({ name: '  Seele  ' }), 'name'), 'Seele');
  assert.equal(readText(new FormData(), 'missing'), '');
});

test('readRequiredText throws a labeled error when the field is blank', () => {
  assert.throws(
    () => readRequiredText(formDataWith({ name: '   ' }), 'name', 'Nombre'),
    /Nombre es obligatorio\./,
  );
});

test('readOptionalText returns undefined instead of an empty string', () => {
  assert.equal(readOptionalText(formDataWith({ password: '' }), 'password'), undefined);
  assert.equal(readOptionalText(formDataWith({ password: 'abc' }), 'password'), 'abc');
});

test('readBoolean accepts checkbox "on" and explicit "true"', () => {
  assert.equal(readBoolean(formDataWith({ isActive: 'on' }), 'isActive'), true);
  assert.equal(readBoolean(formDataWith({ isActive: 'true' }), 'isActive'), true);
  assert.equal(readBoolean(new FormData(), 'isActive'), false);
});

test('readNumber validates numeric, integer and range constraints', () => {
  assert.equal(readNumber(formDataWith({ rarity: '5' }), 'rarity', 'Rareza'), 5);
  assert.throws(
    () => readNumber(formDataWith({ rarity: 'abc' }), 'rarity', 'Rareza'),
    /Rareza debe ser un número válido\./,
  );
  assert.throws(
    () => readNumber(formDataWith({ rarity: '4.5' }), 'rarity', 'Rareza', { integer: true }),
    /Rareza debe ser un número entero\./,
  );
  assert.throws(
    () => readNumber(formDataWith({ rarity: '1' }), 'rarity', 'Rareza', { min: 2 }),
    /Rareza debe ser mayor o igual a 2\./,
  );
});

test('readNumber returns undefined for optional empty fields', () => {
  assert.equal(
    readNumber(new FormData(), 'rarity', 'Rareza', { required: false }),
    undefined,
  );
});
