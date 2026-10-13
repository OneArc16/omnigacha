import assert from 'node:assert/strict';
import { test } from 'vitest';
import { formDataWith } from '../../../../lib/test-utils';
import { buildUserPayload } from './user-payload';

const USER_FORM = {
  name: 'Daniel',
  email: 'daniel@omnigacha.io',
  password: '',
  role: 'ADMIN',
};

test('creating a user requires a password', () => {
  assert.throws(
    () => buildUserPayload(formDataWith(USER_FORM), true),
    /Contraseña es obligatorio\./,
  );

  const payload = buildUserPayload(formDataWith({ ...USER_FORM, password: 'temporal123' }), true);

  assert.equal(payload.password, 'temporal123');
});

test('editing a user keeps the current password unless a new one is typed', () => {
  const unchanged = buildUserPayload(formDataWith(USER_FORM), false);
  const changed = buildUserPayload(formDataWith({ ...USER_FORM, password: 'nueva12345' }), false);

  assert.ok(!('password' in unchanged));
  assert.equal(changed.password, 'nueva12345');
});

test('unchecked checkboxes are sent as false, checked ones as true', () => {
  const unchecked = buildUserPayload(formDataWith(USER_FORM), false);
  const checked = buildUserPayload(
    formDataWith({ ...USER_FORM, isActive: 'on', mustChangePassword: 'on' }),
    false,
  );

  assert.equal(unchecked.isActive, false);
  assert.equal(unchecked.mustChangePassword, false);
  assert.equal(checked.isActive, true);
  assert.equal(checked.mustChangePassword, true);
});

test('user payload defaults the role to USER and requires name and email', () => {
  const payload = buildUserPayload(formDataWith({ ...USER_FORM, role: '' }), false);

  assert.equal(payload.role, 'USER');
  assert.throws(
    () => buildUserPayload(formDataWith({ ...USER_FORM, email: ' ' }), false),
    /Correo es obligatorio\./,
  );
});
