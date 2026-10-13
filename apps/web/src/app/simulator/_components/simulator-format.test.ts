import assert from 'node:assert/strict';
import { test } from 'vitest';
import type { SimulationHistoryItem } from '../../../lib/api';
import { buildEmptyCharacterStatsFormValues } from '../../../lib/character-stats';
import {
  buildStatsPayload,
  formatOptional,
  formatSigned,
  formatStatSummary,
  resolveSimulationType,
} from './simulator-format';

function statInputs(overrides: Record<string, string>) {
  return { ...buildEmptyCharacterStatsFormValues(), ...overrides };
}

function historyItem(
  label: string,
  payload: SimulationHistoryItem['payload'] = {},
): SimulationHistoryItem {
  return { id: 1, userId: 1, label, payload, createdAt: '2026-10-11T18:30:00.000Z' };
}

test('buildStatsPayload converts only the requested stats to API values', () => {
  const stats = buildStatsPayload(
    ['atk', 'crit_rate'],
    statInputs({ atk: '3200', crit_rate: '75', speed: '134' }),
  );

  assert.deepEqual(stats, { atk: 3200, crit_rate: 0.75 });
});

test('buildStatsPayload names the field that is missing', () => {
  assert.throws(
    () => buildStatsPayload(['atk'], statInputs({ atk: '' })),
    /Completa el campo Ataque con un valor válido\./,
  );
});

test('buildStatsPayload requires flat stats to be at least 1', () => {
  assert.throws(
    () => buildStatsPayload(['speed'], statInputs({ speed: '0' })),
    /Velocidad debe ser mayor o igual a 1\./,
  );
});

test('buildStatsPayload allows zero but not negative percentages', () => {
  assert.deepEqual(buildStatsPayload(['crit_rate'], statInputs({ crit_rate: '0' })), {
    crit_rate: 0,
  });
  assert.throws(
    () => buildStatsPayload(['crit_rate'], statInputs({ crit_rate: '-5' })),
    /Prob\. crítico \(%\) no puede ser negativo\./,
  );
});

test('formatSigned always shows the sign', () => {
  assert.equal(formatSigned(16.049), '+16.05');
  assert.equal(formatSigned(-3, 1), '-3.0');
  assert.equal(formatSigned(0), '+0.00');
});

test('formatOptional prints N/A for values missing from old history payloads', () => {
  assert.equal(formatOptional(undefined), 'N/A');
  assert.equal(formatOptional(1.5), '1.50');
  assert.equal(formatOptional(16.05, (value) => `${formatSigned(value)}%`), '+16.05%');
});

test('formatStatSummary joins stat chips in the given order', () => {
  assert.equal(
    formatStatSummary(['atk', 'crit_rate'], { atk: 2800, crit_rate: 0.62 }),
    'Ataque: 2800 · Prob. crítico (%): 62%',
  );
});

test('formatStatSummary infers the keys when the record did not store them', () => {
  assert.equal(formatStatSummary([], { speed: 120 }), 'Velocidad: 120');
  assert.equal(formatStatSummary(['atk'], undefined), 'N/A');
});

test('resolveSimulationType trusts the payload type when present', () => {
  assert.equal(
    resolveSimulationType(historyItem('whatever', { type: 'damage_scenario' })),
    'damage_scenario',
  );
});

test('resolveSimulationType infers the type of legacy records from their label', () => {
  assert.equal(resolveSimulationType(historyItem('damage-sim-kafka')), 'damage_scenario');
  assert.equal(resolveSimulationType(historyItem('recommend-kafka')), 'recommendation');
});
