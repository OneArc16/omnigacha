import { TagCategory, TraceStatKey } from '@prisma/client';
import {
  buildCharacterDefaultStats,
  buildCharacterStatProfile,
  buildCharacterStatSources,
  buildTagBuckets,
  mergeCharacterStats,
  serializeRoleText,
} from './character-catalog';

describe('character-catalog', () => {
  describe('buildTagBuckets', () => {
    it('groups tags by category and removes duplicates', () => {
      const buckets = buildTagBuckets([
        { key: 'DoT', category: TagCategory.ARCHETYPE },
        { key: 'DoT', category: TagCategory.ARCHETYPE },
        { key: 'DPS', category: TagCategory.ROLE },
        { key: 'HighSpeed', category: TagCategory.CHARACTERISTIC },
        { key: 'HighSpeed', category: TagCategory.CHARACTERISTIC },
        { key: 'Fragile', category: TagCategory.CON },
        { key: 'Premium', category: TagCategory.PRO },
        { key: 'NihilityFavored', category: TagCategory.SPECIAL },
      ]);

      expect(buckets).toEqual({
        pros: ['Premium'],
        cons: ['Fragile'],
        archetypes: ['DoT'],
        roles: ['DPS'],
        characteristics: ['HighSpeed'],
        special: ['NihilityFavored'],
        all: [
          'DoT',
          'DPS',
          'HighSpeed',
          'Fragile',
          'Premium',
          'NihilityFavored',
        ],
      });
    });
  });

  describe('buildCharacterStatProfile', () => {
    it('prioritizes atk and avoids crit for DoT DPS profiles', () => {
      const profile = buildCharacterStatProfile({
        pros: [],
        cons: [],
        archetypes: ['DoT', 'Debuff'],
        roles: ['DPS'],
        characteristics: ['ATK-Scaller'],
        special: [],
        all: ['DoT', 'Debuff', 'DPS', 'ATK-Scaller'],
      });

      expect(profile.prioritizedStatKeys).toEqual(['atk']);
      expect(profile.enabledStatKeys).toEqual(
        expect.arrayContaining([
          'atk',
          'effect_hit_rate',
          'elemental_dmg_bonus',
          'speed',
        ]),
      );
      expect(profile.enabledStatKeys).not.toContain('crit_rate');
      expect(profile.enabledStatKeys).not.toContain('crit_damage');
    });

    it('enables break, speed and energy tools for break sustain profiles', () => {
      const profile = buildCharacterStatProfile({
        pros: [],
        cons: [],
        archetypes: ['Break'],
        roles: ['Sustain', 'Amplifier'],
        characteristics: ['Break-Scaller', 'HighEnergy', 'HighSpeed'],
        special: [],
        all: [
          'Break',
          'Sustain',
          'Amplifier',
          'Break-Scaller',
          'HighEnergy',
          'HighSpeed',
        ],
      });

      expect(profile.prioritizedStatKeys).toEqual(['break_effect']);
      expect(profile.enabledStatKeys).toEqual(
        expect.arrayContaining([
          'break_effect',
          'speed',
          'energy_regen_rate',
          'effect_res',
        ]),
      );
    });
  });

  describe('buildCharacterDefaultStats', () => {
    it('applies percent traces to base hp/atk/def and flat traces directly', () => {
      const stats = buildCharacterDefaultStats({
        baseHp: 1000,
        baseAtk: 700,
        baseDef: 400,
        baseSpeed: 100,
        baseCritRate: null,
        baseCritDamage: null,
        traceStats: [
          { statKey: TraceStatKey.HP_PERCENT, value: 0.18 },
          { statKey: TraceStatKey.ATK_PERCENT, value: 0.28 },
          { statKey: TraceStatKey.DEF_PERCENT, value: 0.12 },
          { statKey: TraceStatKey.SPEED_FLAT, value: 5 },
          { statKey: TraceStatKey.CRIT_RATE, value: 0.08 },
          { statKey: TraceStatKey.EFFECT_HIT_RATE, value: 0.1 },
          { statKey: TraceStatKey.ELEMENTAL_DMG_BONUS, value: 0.224 },
        ],
      });

      expect(stats).toEqual({
        hp: 1180,
        atk: 896,
        def: 448,
        speed: 105,
        crit_rate: 0.13,
        crit_damage: 0.5,
        break_effect: 0,
        energy_regen_rate: 0,
        effect_hit_rate: 0.1,
        effect_res: 0,
        elemental_dmg_bonus: 0.224,
      });
    });

    it('keeps explicit base crit values and adds direct trace bonuses', () => {
      const stats = buildCharacterDefaultStats({
        baseHp: 900,
        baseAtk: 600,
        baseDef: 500,
        baseSpeed: 98,
        baseCritRate: 0.12,
        baseCritDamage: 0.68,
        traceStats: [{ statKey: TraceStatKey.CRIT_DAMAGE, value: 0.24 }],
      });

      expect(stats.crit_rate).toBe(0.12);
      expect(stats.crit_damage).toBe(0.92);
    });
  });

  describe('stat source helpers', () => {
    it('merges overrides and tracks their source over catalog defaults', () => {
      const baseStats = {
        atk: 1200,
        speed: 102,
        crit_rate: 0.05,
      };
      const overrideStats = {
        atk: 1540,
        crit_damage: 1.8,
      };

      expect(mergeCharacterStats(baseStats, overrideStats)).toEqual({
        atk: 1540,
        speed: 102,
        crit_rate: 0.05,
        crit_damage: 1.8,
      });

      expect(
        buildCharacterStatSources(
          baseStats,
          overrideStats,
          'legacy_migrated',
        ),
      ).toEqual({
        atk: 'legacy_migrated',
        speed: 'catalog_default',
        crit_rate: 'catalog_default',
        crit_damage: 'legacy_migrated',
      });
    });
  });

  describe('serializeRoleText', () => {
    it('joins multiple roles and falls back to unknown when empty', () => {
      expect(
        serializeRoleText({
          pros: [],
          cons: [],
          archetypes: [],
          roles: ['DPS', 'Amplifier'],
          characteristics: [],
          special: [],
          all: ['DPS', 'Amplifier'],
        }),
      ).toBe('DPS / Amplifier');

      expect(
        serializeRoleText({
          pros: [],
          cons: [],
          archetypes: [],
          roles: [],
          characteristics: [],
          special: [],
          all: [],
        }),
      ).toBe('Unknown');
    });
  });
});
