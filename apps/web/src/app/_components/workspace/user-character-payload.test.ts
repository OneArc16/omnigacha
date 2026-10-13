import assert from 'node:assert/strict';
import { test } from 'vitest';
import type { UserCharacterFormValues } from '../../../components/characters/user-character-form';
import type { Character, LightCone, UserCharacter } from '../../../lib/api';
import { buildEmptyCharacterStatsFormValues } from '../../../lib/character-stats';
import {
  buildCreateCharacterFormValues,
  buildEditCharacterFormValues,
  buildUserCharacterPayload,
  formatLightConeSummary,
} from './user-character-payload';

const CHARACTER = {
  id: 3,
  name: 'Kafka',
  defaultStats: { atk: 679, crit_rate: 0.05 },
  statProfile: { prioritizedStatKeys: ['atk', 'crit_rate'], enabledStatKeys: [] },
} as unknown as Character;

function formValues(
  overrides: Partial<UserCharacterFormValues> = {},
): UserCharacterFormValues {
  return {
    characterId: '3',
    lightConeId: '',
    level: '80',
    eidolon: '2',
    stats: buildEmptyCharacterStatsFormValues(),
    lightConeLevel: '',
    ...overrides,
  };
}

function rosterEntry(overrides: Partial<UserCharacter> = {}): UserCharacter {
  return {
    id: 10,
    level: 70,
    eidolon: 1,
    stats: { atk: 2800 },
    character: CHARACTER,
    ...overrides,
  } as UserCharacter;
}

test('payload without manual stats sends base fields and no stats key', () => {
  const payload = buildUserCharacterPayload(formValues(), CHARACTER, false);

  assert.deepEqual(payload, {
    characterId: 3,
    level: 80,
    eidolon: 2,
    lightConeId: null,
    lightConeLevel: null,
  });
});

test('payload truncates decimals in base fields', () => {
  const payload = buildUserCharacterPayload(formValues({ level: '80.9' }), CHARACTER, false);

  assert.equal(payload.level, 80);
});

test('payload rejects non-numeric and out-of-range base fields', () => {
  assert.throws(
    () => buildUserCharacterPayload(formValues({ level: 'abc' }), CHARACTER, false),
    /valores numéricos válidos/,
  );
  assert.throws(
    () => buildUserCharacterPayload(formValues({ level: '0' }), CHARACTER, false),
    /mínimos permitidos/,
  );
  assert.throws(
    () => buildUserCharacterPayload(formValues({ eidolon: '-1' }), CHARACTER, false),
    /mínimos permitidos/,
  );
});

test('manual stats cover exactly the stats visible for the character', () => {
  const stats = { ...buildEmptyCharacterStatsFormValues(), atk: '3000', crit_rate: '70', hp: '9999' };
  const payload = buildUserCharacterPayload(formValues({ stats }), CHARACTER, true);

  assert.deepEqual(payload.stats, { atk: 3000, crit_rate: 0.7 });
});

test('manual stats fail when a visible stat is blank or no character is selected', () => {
  const stats = { ...buildEmptyCharacterStatsFormValues(), atk: '3000' };

  assert.throws(
    () => buildUserCharacterPayload(formValues({ stats }), CHARACTER, true),
    /Completa el campo crit_rate/,
  );
  assert.throws(
    () => buildUserCharacterPayload(formValues({ stats }), null, true),
    /Selecciona un personaje antes de guardar stats\./,
  );
});

test('light cone id and level are sent together', () => {
  const payload = buildUserCharacterPayload(
    formValues({ lightConeId: '5', lightConeLevel: '80' }),
    CHARACTER,
    false,
  );

  assert.equal(payload.lightConeId, 5);
  assert.equal(payload.lightConeLevel, 80);
});

test('a light cone level needs a valid light cone', () => {
  assert.throws(
    () => buildUserCharacterPayload(formValues({ lightConeLevel: '80' }), CHARACTER, false),
    /Selecciona un cono de luz antes de guardar su nivel\./,
  );
  assert.throws(
    () => buildUserCharacterPayload(formValues({ lightConeId: '0' }), CHARACTER, false),
    /Selecciona un cono de luz válido\./,
  );
});

test('create form starts from the catalog defaults of the chosen character', () => {
  const values = buildCreateCharacterFormValues(CHARACTER);

  assert.equal(values.characterId, '3');
  assert.equal(values.level, '80');
  assert.equal(values.eidolon, '0');
  assert.equal(values.stats.atk, '679');
  assert.equal(buildCreateCharacterFormValues(null).characterId, '');
});

test('edit form resolves a legacy light cone name to its catalog id', () => {
  const lightCones = [{ id: 7, name: 'Patience Is All You Need' }] as LightCone[];
  const values = buildEditCharacterFormValues(
    rosterEntry({ lightConeName: 'Patience Is All You Need', lightConeLevel: 80 }),
    lightCones,
  );

  assert.equal(values.lightConeId, '7');
  assert.equal(values.lightConeLevel, '80');
  assert.equal(values.stats.atk, '2800');
});

test('edit form drops the light cone level when the cone cannot be resolved', () => {
  const values = buildEditCharacterFormValues(
    rosterEntry({ lightConeName: 'Desconocido', lightConeLevel: 80 }),
    [],
  );

  assert.equal(values.lightConeId, '');
  assert.equal(values.lightConeLevel, '');
});

test('formatLightConeSummary describes the equipped cone', () => {
  assert.equal(formatLightConeSummary(rosterEntry()), 'Sin cono de luz registrado');
  assert.equal(
    formatLightConeSummary(rosterEntry({ lightConeName: 'Cruising' })),
    'Cono: Cruising',
  );
  assert.equal(
    formatLightConeSummary(
      rosterEntry({
        lightCone: { id: 7, name: 'Patience', path: 'Nihility', rarity: 5 },
        lightConeLevel: 80,
      }),
    ),
    'Cono: Patience · Nivel 80',
  );
});
