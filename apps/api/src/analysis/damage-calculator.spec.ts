import {
  buildBalancedTeam,
  countCompatibleTeams,
  inferTeamRole,
} from './damage-calculator';
import { mergeDerivedSynergyEdges } from './catalog-synergy';
import {
  AnalysisCharacter,
  EMPTY_ANALYSIS_OFFENSE_MODIFIERS,
  SynergyEdge,
} from './types';

function createCharacter(input: {
  id: number;
  name: string;
  element?: string;
  path: string;
  roleText: string;
  atk: number;
  critRate: number;
  critDamage: number;
  speed: number;
  tagKeys?: string[];
}): AnalysisCharacter {
  return {
    ...input,
    element: input.element ?? 'Lightning',
    tagKeys: input.tagKeys ?? [],
    statProfile: {
      prioritizedStatKeys: [],
      enabledStatKeys: ['atk', 'crit_rate', 'crit_damage', 'speed'],
    },
    stats: {
      atk: input.atk,
      crit_rate: input.critRate,
      crit_damage: input.critDamage,
      speed: input.speed,
    },
    hp: 0,
    def: 0,
    breakEffect: 0,
    energyRegenRate: 0,
    effectHitRate: 0,
    effectRes: 0,
    elementalDmgBonus: 0,
    modifiers: { ...EMPTY_ANALYSIS_OFFENSE_MODIFIERS },
  };
}

describe('buildBalancedTeam', () => {
  it('prioritizes teammates with direct synergy to forced target when enough options exist', () => {
    const kafka = createCharacter({
      id: 1,
      name: 'Kafka',
      path: 'Nihility',
      roleText: 'DPS',
      atk: 2700,
      critRate: 0.45,
      critDamage: 1.1,
      speed: 130,
    });

    const blackSwan = createCharacter({
      id: 2,
      name: 'Black Swan',
      path: 'Nihility',
      roleText: 'Sub DPS',
      atk: 2500,
      critRate: 0.4,
      critDamage: 1.0,
      speed: 129,
    });

    const ruanMei = createCharacter({
      id: 3,
      name: 'Ruan Mei',
      path: 'Harmony',
      roleText: 'Support',
      atk: 1600,
      critRate: 0.12,
      critDamage: 0.7,
      speed: 142,
    });

    const huohuo = createCharacter({
      id: 4,
      name: 'Huohuo',
      path: 'Abundance',
      roleText: 'Sustain',
      atk: 1300,
      critRate: 0.08,
      critDamage: 0.55,
      speed: 137,
    });

    const acheron = createCharacter({
      id: 5,
      name: 'Acheron',
      path: 'Nihility',
      roleText: 'DPS',
      atk: 5200,
      critRate: 0.7,
      critDamage: 2.2,
      speed: 134,
    });

    const roster = [kafka, blackSwan, ruanMei, huohuo, acheron];
    const synergyEdges: SynergyEdge[] = [
      {
        sourceCharacterId: kafka.id,
        targetCharacterId: blackSwan.id,
        weight: 95,
      },
      {
        sourceCharacterId: kafka.id,
        targetCharacterId: ruanMei.id,
        weight: 84,
      },
      { sourceCharacterId: kafka.id, targetCharacterId: huohuo.id, weight: 80 },
    ];

    const team = buildBalancedTeam(roster, kafka.id, synergyEdges);
    const memberIds = new Set(team.map((member) => member.id));

    expect(team).toHaveLength(4);
    expect(memberIds).toEqual(new Set([1, 2, 3, 4]));
    expect(memberIds.has(acheron.id)).toBe(false);
  });

  it('falls back to non-linked members when forced target has fewer than 3 direct links', () => {
    const kafka = createCharacter({
      id: 10,
      name: 'Kafka',
      path: 'Nihility',
      roleText: 'DPS',
      atk: 2700,
      critRate: 0.45,
      critDamage: 1.1,
      speed: 130,
    });

    const ruanMei = createCharacter({
      id: 11,
      name: 'Ruan Mei',
      path: 'Harmony',
      roleText: 'Support',
      atk: 1600,
      critRate: 0.12,
      critDamage: 0.7,
      speed: 142,
    });

    const huohuo = createCharacter({
      id: 12,
      name: 'Huohuo',
      path: 'Abundance',
      roleText: 'Sustain',
      atk: 1300,
      critRate: 0.08,
      critDamage: 0.55,
      speed: 137,
    });

    const acheron = createCharacter({
      id: 13,
      name: 'Acheron',
      path: 'Nihility',
      roleText: 'DPS',
      atk: 5200,
      critRate: 0.7,
      critDamage: 2.2,
      speed: 134,
    });

    const roster = [kafka, ruanMei, huohuo, acheron];
    const synergyEdges: SynergyEdge[] = [
      {
        sourceCharacterId: kafka.id,
        targetCharacterId: ruanMei.id,
        weight: 84,
      },
      { sourceCharacterId: kafka.id, targetCharacterId: huohuo.id, weight: 80 },
    ];

    const team = buildBalancedTeam(roster, kafka.id, synergyEdges);
    const memberIds = new Set(team.map((member) => member.id));

    expect(team).toHaveLength(4);
    expect(memberIds).toEqual(new Set([10, 11, 12, 13]));
  });

  it('still infers support and sustain roles correctly for balanced selection', () => {
    const supportRole = inferTeamRole('Harmony', 'Buffer');
    const sustainRole = inferTeamRole('Abundance', 'Healer');
    const supportDpsRole = inferTeamRole('Nihility', 'Support-DPS');
    const acheronRole = inferTeamRole('Nihility', 'DPS', [
      'Debuff',
      'DPS',
      'ATK-Scaller',
    ]);
    const hysilensRole = inferTeamRole('Nihility', 'DPS', [
      'DoT',
      'Debuff',
      'DPS',
      'ATK-Scaller',
    ]);
    const jiaoqiuRole = inferTeamRole('Nihility', 'Amplifier', [
      'Debuff',
      'Amplifier',
      'ATK-Scaller',
    ]);

    expect(supportRole).toBe('support');
    expect(sustainRole).toBe('sustain');
    expect(supportDpsRole).toBe('sub_dps');
    expect(acheronRole).toBe('dps');
    expect(hysilensRole).toBe('dps');
    expect(jiaoqiuRole).toBe('support');
  });

  it('prefers follow-up shell teammates around a Feixiao-like forced target', () => {
    const feixiao = createCharacter({
      id: 20,
      name: 'Feixiao',
      path: 'Hunt',
      roleText: 'DPS',
      atk: 3600,
      critRate: 0.78,
      critDamage: 1.9,
      speed: 140,
      tagKeys: ['DPS', 'ATK-Scaller'],
    });

    const robin = createCharacter({
      id: 21,
      name: 'Robin',
      path: 'Harmony',
      roleText: 'Amplifier',
      atk: 1900,
      critRate: 0.1,
      critDamage: 0.6,
      speed: 124,
      tagKeys: ['Advance', 'Buff', 'Amplifier', 'ATK-Scaller'],
    });

    const aventurine = createCharacter({
      id: 22,
      name: 'Aventurine',
      path: 'Preservation',
      roleText: 'Sustain',
      atk: 1300,
      critRate: 0.08,
      critDamage: 0.5,
      speed: 134,
      tagKeys: ['SP-Friendly', 'Debuff', 'Sustain', 'DEF-Scaller'],
    });

    const topaz = createCharacter({
      id: 23,
      name: 'Topaz y Conti',
      path: 'Hunt',
      roleText: 'Support-DPS',
      atk: 3000,
      critRate: 0.7,
      critDamage: 1.6,
      speed: 138,
      tagKeys: ['Debuff', 'Support-DPS', 'ATK-Scaller'],
    });

    const acheron = createCharacter({
      id: 24,
      name: 'Acheron',
      path: 'Nihility',
      roleText: 'DPS',
      atk: 5200,
      critRate: 0.84,
      critDamage: 2.5,
      speed: 134,
      tagKeys: ['Debuff', 'DPS', 'ATK-Scaller'],
    });

    const roster = [feixiao, robin, aventurine, topaz, acheron];
    const synergyEdges = mergeDerivedSynergyEdges(
      roster,
      [],
      (source, target, weight) => ({
        sourceCharacterId: source.id,
        targetCharacterId: target.id,
        weight,
      }),
    );

    const team = buildBalancedTeam(roster, feixiao.id, synergyEdges);
    const memberIds = new Set(team.map((member) => member.id));

    expect(team).toHaveLength(4);
    expect(memberIds).toEqual(new Set([20, 21, 22, 23]));
    expect(memberIds.has(acheron.id)).toBe(false);
  });

  it('avoids filling a shell-dependent target with double off-target carries when only one real link exists', () => {
    const feixiao = createCharacter({
      id: 25,
      name: 'Feixiao',
      path: 'Hunt',
      roleText: 'DPS',
      atk: 3600,
      critRate: 0.78,
      critDamage: 1.9,
      speed: 140,
      tagKeys: ['DPS', 'ATK-Scaller'],
    });

    const aventurine = createCharacter({
      id: 26,
      name: 'Aventurine',
      path: 'Preservation',
      roleText: 'Sustain',
      atk: 1300,
      critRate: 0.08,
      critDamage: 0.5,
      speed: 134,
      tagKeys: ['SP-Friendly', 'Debuff', 'Sustain', 'DEF-Scaller'],
    });

    const sparkle = createCharacter({
      id: 27,
      name: 'Sparkle',
      path: 'Harmony',
      roleText: 'Amplifier',
      atk: 1600,
      critRate: 0.1,
      critDamage: 2.45,
      speed: 161,
      tagKeys: ['Advance', 'Buff', 'Amplifier', 'CritDMG-Scaller'],
    });

    const ruanMei = createCharacter({
      id: 28,
      name: 'Ruan Mei',
      path: 'Harmony',
      roleText: 'Support',
      atk: 1600,
      critRate: 0.12,
      critDamage: 0.7,
      speed: 142,
      tagKeys: ['Buff', 'Delay', 'Break', 'Amplifier'],
    });

    const acheron = createCharacter({
      id: 29,
      name: 'Acheron',
      path: 'Nihility',
      roleText: 'DPS',
      atk: 5200,
      critRate: 0.84,
      critDamage: 2.5,
      speed: 134,
      tagKeys: ['Debuff', 'DPS', 'ATK-Scaller'],
    });

    const jingliu = createCharacter({
      id: 30,
      name: 'Jingliu',
      path: 'Destruction',
      roleText: 'DPS',
      atk: 4700,
      critRate: 0.78,
      critDamage: 2.2,
      speed: 135,
      tagKeys: ['DPS', 'HP-Scaller'],
    });

    const roster = [feixiao, aventurine, sparkle, ruanMei, acheron, jingliu];
    const synergyEdges = mergeDerivedSynergyEdges(
      roster,
      [],
      (source, target, weight) => ({
        sourceCharacterId: source.id,
        targetCharacterId: target.id,
        weight,
      }),
    );

    const team = buildBalancedTeam(roster, feixiao.id, synergyEdges);
    const memberIds = new Set(team.map((member) => member.id));

    expect(team).toHaveLength(4);
    expect(memberIds).toEqual(new Set([25, 26, 27, 28]));
    expect(memberIds.has(acheron.id)).toBe(false);
    expect(memberIds.has(jingliu.id)).toBe(false);
  });

  it('prefers counter shell supports around a Yunli-like forced target', () => {
    const yunli = createCharacter({
      id: 30,
      name: 'Yunli',
      path: 'Destruction',
      roleText: 'DPS',
      atk: 4100,
      critRate: 0.82,
      critDamage: 2.1,
      speed: 109,
      tagKeys: ['DPS', 'ATK-Scaller', 'BaseSpeed'],
    });

    const robin = createCharacter({
      id: 31,
      name: 'Robin',
      path: 'Harmony',
      roleText: 'Amplifier',
      atk: 1900,
      critRate: 0.1,
      critDamage: 0.6,
      speed: 124,
      tagKeys: ['Advance', 'Buff', 'Amplifier', 'ATK-Scaller'],
    });

    const tingyun = createCharacter({
      id: 32,
      name: 'Tingyun',
      path: 'Harmony',
      roleText: 'Amplifier',
      atk: 1500,
      critRate: 0.08,
      critDamage: 0.5,
      speed: 142,
      tagKeys: ['Buff', 'Energy', 'Amplifier', 'ATK-Scaller'],
    });

    const huohuo = createCharacter({
      id: 33,
      name: 'Huohuo',
      path: 'Abundance',
      roleText: 'Sustain',
      atk: 1300,
      critRate: 0.08,
      critDamage: 0.55,
      speed: 137,
      tagKeys: ['Energy', 'Sustain'],
    });

    const acheron = createCharacter({
      id: 34,
      name: 'Acheron',
      path: 'Nihility',
      roleText: 'DPS',
      atk: 5200,
      critRate: 0.84,
      critDamage: 2.5,
      speed: 134,
      tagKeys: ['Debuff', 'DPS', 'ATK-Scaller'],
    });

    const roster = [yunli, robin, tingyun, huohuo, acheron];
    const synergyEdges = mergeDerivedSynergyEdges(
      roster,
      [],
      (source, target, weight) => ({
        sourceCharacterId: source.id,
        targetCharacterId: target.id,
        weight,
      }),
    );

    const team = buildBalancedTeam(roster, yunli.id, synergyEdges);
    const memberIds = new Set(team.map((member) => member.id));

    expect(team).toHaveLength(4);
    expect(memberIds).toEqual(new Set([30, 31, 32, 33]));
    expect(memberIds.has(acheron.id)).toBe(false);
  });

  it('prefers summon shell teammates around a Jing Yuan-like forced target', () => {
    const jingYuan = createCharacter({
      id: 40,
      name: 'Jing Yuan',
      path: 'Erudition',
      roleText: 'DPS',
      atk: 3900,
      critRate: 0.74,
      critDamage: 2.05,
      speed: 134,
      tagKeys: ['DPS', 'ATK-Scaller'],
    });

    const sunday = createCharacter({
      id: 41,
      name: 'Sunday',
      path: 'Harmony',
      roleText: 'Amplifier',
      atk: 1700,
      critRate: 0.08,
      critDamage: 2.2,
      speed: 136,
      tagKeys: ['Advance', 'Buff', 'Energy', 'Amplifier', 'SpeedTunning'],
    });

    const robin = createCharacter({
      id: 42,
      name: 'Robin',
      path: 'Harmony',
      roleText: 'Amplifier',
      atk: 1900,
      critRate: 0.1,
      critDamage: 0.6,
      speed: 124,
      tagKeys: ['Advance', 'Buff', 'Amplifier', 'ATK-Scaller'],
    });

    const huohuo = createCharacter({
      id: 43,
      name: 'Huohuo',
      path: 'Abundance',
      roleText: 'Sustain',
      atk: 1300,
      critRate: 0.08,
      critDamage: 0.55,
      speed: 137,
      tagKeys: ['Energy', 'Sustain'],
    });

    const acheron = createCharacter({
      id: 44,
      name: 'Acheron',
      path: 'Nihility',
      roleText: 'DPS',
      atk: 5200,
      critRate: 0.84,
      critDamage: 2.5,
      speed: 134,
      tagKeys: ['Debuff', 'DPS', 'ATK-Scaller'],
    });

    const roster = [jingYuan, sunday, robin, huohuo, acheron];
    const synergyEdges = mergeDerivedSynergyEdges(
      roster,
      [],
      (source, target, weight) => ({
        sourceCharacterId: source.id,
        targetCharacterId: target.id,
        weight,
      }),
    );

    const team = buildBalancedTeam(roster, jingYuan.id, synergyEdges);
    const memberIds = new Set(team.map((member) => member.id));

    expect(team).toHaveLength(4);
    expect(memberIds).toEqual(new Set([40, 41, 42, 43]));
    expect(memberIds.has(acheron.id)).toBe(false);
  });

  it('prefers a memosprite shell around an Aglaea-like forced target', () => {
    const aglaea = createCharacter({
      id: 50,
      name: 'Aglaea',
      path: 'Remembrance',
      roleText: 'DPS',
      atk: 4100,
      critRate: 0.82,
      critDamage: 2.1,
      speed: 132,
      tagKeys: ['Advance', 'SP-Friendly', 'DPS', 'ATK-Scaller', 'SPD-Scaller'],
    });

    const sunday = createCharacter({
      id: 51,
      name: 'Sunday',
      path: 'Harmony',
      roleText: 'Amplifier',
      atk: 1700,
      critRate: 0.08,
      critDamage: 2.2,
      speed: 136,
      tagKeys: ['Advance', 'Buff', 'Energy', 'Amplifier', 'SpeedTunning'],
    });

    const remembranceTrailblazer = createCharacter({
      id: 52,
      name: 'Trazacaminos: Reminiscencia',
      path: 'Remembrance',
      roleText: 'Amplifier',
      atk: 1800,
      critRate: 0.12,
      critDamage: 1.8,
      speed: 145,
      tagKeys: ['Advance', 'Buff', 'Amplifier', 'CritDMG-Scaller'],
    });

    const huohuo = createCharacter({
      id: 53,
      name: 'Huohuo',
      path: 'Abundance',
      roleText: 'Sustain',
      atk: 1300,
      critRate: 0.08,
      critDamage: 0.55,
      speed: 137,
      tagKeys: ['Energy', 'Sustain'],
    });

    const acheron = createCharacter({
      id: 54,
      name: 'Acheron',
      path: 'Nihility',
      roleText: 'DPS',
      atk: 5200,
      critRate: 0.84,
      critDamage: 2.5,
      speed: 134,
      tagKeys: ['Debuff', 'DPS', 'ATK-Scaller'],
    });

    const roster = [aglaea, sunday, remembranceTrailblazer, huohuo, acheron];
    const synergyEdges = mergeDerivedSynergyEdges(
      roster,
      [],
      (source, target, weight) => ({
        sourceCharacterId: source.id,
        targetCharacterId: target.id,
        weight,
      }),
    );

    const team = buildBalancedTeam(roster, aglaea.id, synergyEdges);
    const memberIds = new Set(team.map((member) => member.id));

    expect(team).toHaveLength(4);
    expect(memberIds).toEqual(new Set([50, 51, 52, 53]));
    expect(memberIds.has(acheron.id)).toBe(false);
  });

  it('prefers a hypercarry shell around an Imbibitor Lunae-like forced target', () => {
    const imbibitorLunae = createCharacter({
      id: 60,
      name: 'Dan Heng - Imbibitor Lunae',
      path: 'Destruction',
      roleText: 'DPS',
      atk: 4300,
      critRate: 0.82,
      critDamage: 2.15,
      speed: 102,
      tagKeys: ['SP-Unfriendly', 'DPS', 'ATK-Scaller'],
    });

    const sparkle = createCharacter({
      id: 61,
      name: 'Sparkle',
      path: 'Harmony',
      roleText: 'Amplifier',
      atk: 1600,
      critRate: 0.1,
      critDamage: 2.45,
      speed: 161,
      tagKeys: ['Advance', 'Buff', 'Amplifier', 'CritDMG-Scaller'],
    });

    const sunday = createCharacter({
      id: 62,
      name: 'Sunday',
      path: 'Harmony',
      roleText: 'Amplifier',
      atk: 1700,
      critRate: 0.08,
      critDamage: 2.2,
      speed: 136,
      tagKeys: ['Advance', 'Buff', 'Energy', 'Amplifier', 'SpeedTunning'],
    });

    const huohuo = createCharacter({
      id: 63,
      name: 'Huohuo',
      path: 'Abundance',
      roleText: 'Sustain',
      atk: 1300,
      critRate: 0.08,
      critDamage: 0.55,
      speed: 137,
      tagKeys: ['Energy', 'Sustain'],
    });

    const acheron = createCharacter({
      id: 64,
      name: 'Acheron',
      path: 'Nihility',
      roleText: 'DPS',
      atk: 5200,
      critRate: 0.84,
      critDamage: 2.5,
      speed: 134,
      tagKeys: ['Debuff', 'DPS', 'ATK-Scaller'],
    });

    const roster = [imbibitorLunae, sparkle, sunday, huohuo, acheron];
    const synergyEdges = mergeDerivedSynergyEdges(
      roster,
      [],
      (source, target, weight) => ({
        sourceCharacterId: source.id,
        targetCharacterId: target.id,
        weight,
      }),
    );

    const team = buildBalancedTeam(roster, imbibitorLunae.id, synergyEdges);
    const memberIds = new Set(team.map((member) => member.id));

    expect(team).toHaveLength(4);
    expect(memberIds).toEqual(new Set([60, 61, 62, 63]));
    expect(memberIds.has(acheron.id)).toBe(false);
  });

  it('returns zero compatible teams when a shell-dependent target only has one real teammate link', () => {
    const feixiao = createCharacter({
      id: 70,
      name: 'Feixiao',
      path: 'Hunt',
      roleText: 'DPS',
      atk: 3600,
      critRate: 0.78,
      critDamage: 1.9,
      speed: 140,
      tagKeys: ['DPS', 'ATK-Scaller'],
    });

    const aventurine = createCharacter({
      id: 71,
      name: 'Aventurine',
      path: 'Preservation',
      roleText: 'Sustain',
      atk: 1300,
      critRate: 0.08,
      critDamage: 0.5,
      speed: 134,
      tagKeys: ['SP-Friendly', 'Debuff', 'Sustain', 'DEF-Scaller'],
    });

    const sparkle = createCharacter({
      id: 72,
      name: 'Sparkle',
      path: 'Harmony',
      roleText: 'Amplifier',
      atk: 1600,
      critRate: 0.1,
      critDamage: 2.45,
      speed: 161,
      tagKeys: ['Advance', 'Buff', 'Amplifier', 'CritDMG-Scaller'],
    });

    const ruanMei = createCharacter({
      id: 73,
      name: 'Ruan Mei',
      path: 'Harmony',
      roleText: 'Support',
      atk: 1600,
      critRate: 0.12,
      critDamage: 0.7,
      speed: 142,
      tagKeys: ['Buff', 'Delay', 'Break', 'Amplifier'],
    });

    const huohuo = createCharacter({
      id: 74,
      name: 'Huohuo',
      path: 'Abundance',
      roleText: 'Sustain',
      atk: 1300,
      critRate: 0.08,
      critDamage: 0.55,
      speed: 137,
      tagKeys: ['Energy', 'Sustain'],
    });

    const roster = [feixiao, aventurine, sparkle, ruanMei, huohuo];
    const synergyEdges = mergeDerivedSynergyEdges(
      roster,
      [],
      (source, target, weight) => ({
        sourceCharacterId: source.id,
        targetCharacterId: target.id,
        weight,
      }),
    );

    expect(countCompatibleTeams(roster, feixiao.id, synergyEdges)).toBe(0);
  });
});
