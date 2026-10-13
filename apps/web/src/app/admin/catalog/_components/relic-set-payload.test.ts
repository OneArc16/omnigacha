import assert from 'node:assert/strict';
import { test } from 'vitest';
import { formDataWith } from '../../../../lib/test-utils';
import { buildRelicSetPayload } from './relic-set-payload';

const RELIC_SET_FORM = {
  name: 'Musketeer of Wild Wheat',
  slug: '',
  rarity: '5',
  gameVersion: '',
  status: 'DRAFT',
  twoPieceBonus: 'ATK +12%',
  fourPieceBonus: '',
};

test('relic set payload takes its type from the screen, not from the form', () => {
  const artifact = buildRelicSetPayload(formDataWith(RELIC_SET_FORM), 'ARTIFACT');
  const ornament = buildRelicSetPayload(formDataWith(RELIC_SET_FORM), 'ORNAMENT');

  assert.equal(artifact.type, 'ARTIFACT');
  assert.equal(ornament.type, 'ORNAMENT');
});

test('relic set payload requires the two-piece bonus and keeps the four-piece optional', () => {
  const payload = buildRelicSetPayload(formDataWith(RELIC_SET_FORM), 'ORNAMENT');

  assert.equal(payload.twoPieceBonus, 'ATK +12%');
  assert.ok(!('fourPieceBonus' in payload));
  assert.throws(
    () =>
      buildRelicSetPayload(formDataWith({ ...RELIC_SET_FORM, twoPieceBonus: '' }), 'ARTIFACT'),
    /Bonus de 2 piezas es obligatorio\./,
  );
});

test('relic set payload includes the four-piece bonus and game version when provided', () => {
  const payload = buildRelicSetPayload(
    formDataWith({ ...RELIC_SET_FORM, fourPieceBonus: 'SPD +6%', gameVersion: '3.8' }),
    'ARTIFACT',
  );

  assert.equal(payload.fourPieceBonus, 'SPD +6%');
  assert.equal(payload.gameVersion, '3.8');
});
