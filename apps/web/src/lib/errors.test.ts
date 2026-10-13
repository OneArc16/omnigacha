import assert from 'node:assert/strict';
import { test } from 'vitest';
import { z } from 'zod';
import { resolveErrorMessage } from './errors';

test('resolveErrorMessage surfaces the first zod issue instead of the raw JSON dump', () => {
  const schema = z.object({
    email: z.string().email('Ingresa un correo válido.'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  });
  const result = schema.safeParse({ email: 'no-es-correo', password: '123' });

  assert.equal(result.success, false);
  assert.equal(
    resolveErrorMessage(result.error, 'fallback'),
    'Ingresa un correo válido.',
  );
});

test('resolveErrorMessage uses the message of regular errors', () => {
  assert.equal(resolveErrorMessage(new Error('Sin conexión'), 'fallback'), 'Sin conexión');
});

test('resolveErrorMessage falls back for values that are not errors', () => {
  assert.equal(resolveErrorMessage('boom', 'No fue posible guardar'), 'No fue posible guardar');
  assert.equal(resolveErrorMessage(undefined, 'No fue posible guardar'), 'No fue posible guardar');
});
