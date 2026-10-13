import assert from 'node:assert/strict';
import { test } from 'vitest';
import { formDataWith } from '../../../../../lib/test-utils';
import { buildLightConePayload } from './light-cone-payload';

const LIGHT_CONE_FORM = {
  name: 'Cruising in the Stellar Sea',
  slug: '',
  path: 'Hunt',
  rarity: '5',
  status: 'DRAFT',
  effectDescription: '',
};

test('light cone payload requires the path and omits a blank effect', () => {
  assert.deepEqual(buildLightConePayload(formDataWith(LIGHT_CONE_FORM)), {
    name: 'Cruising in the Stellar Sea',
    rarity: 5,
    status: 'DRAFT',
    path: 'Hunt',
  });
  assert.throws(
    () => buildLightConePayload(formDataWith({ ...LIGHT_CONE_FORM, path: '' })),
    /Camino es obligatorio\./,
  );
});

test('light cone payload includes the effect description when written', () => {
  const payload = buildLightConePayload(
    formDataWith({ ...LIGHT_CONE_FORM, effectDescription: 'Aumenta la prob. crítica.' }),
  );

  assert.equal(payload.effectDescription, 'Aumenta la prob. crítica.');
});
