import { buildBalancedTeam, inferTeamRole } from './damage-calculator';
import {
  AnalysisCharacter,
  EMPTY_ANALYSIS_OFFENSE_MODIFIERS,
  SynergyEdge,
} from './types';

function createCharacter(input: {
  id: number;
  name: string;
  path: string;
  roleText: string;
  atk: number;
  critRate: number;
  critDamage: number;
  speed: number;
}): AnalysisCharacter {
  return {
    ...input,
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

    expect(supportRole).toBe('support');
    expect(sustainRole).toBe('sustain');
  });
});
