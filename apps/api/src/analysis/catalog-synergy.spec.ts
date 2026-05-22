import {
  deriveCatalogSynergyWeight,
  mergeDerivedSynergyEdges,
} from './catalog-synergy';
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
  tagKeys: string[];
}): AnalysisCharacter {
  return {
    ...input,
    element: 'Lightning',
    statProfile: {
      prioritizedStatKeys: [],
      enabledStatKeys: ['atk', 'crit_rate', 'crit_damage', 'speed'],
    },
    stats: {
      atk: 2500,
      crit_rate: 0.4,
      crit_damage: 1.1,
      speed: 134,
    },
    hp: 1000,
    atk: 2500,
    def: 500,
    critRate: 0.4,
    critDamage: 1.1,
    breakEffect: 0,
    energyRegenRate: 0,
    effectHitRate: 0.2,
    effectRes: 0,
    elementalDmgBonus: 0.1,
    speed: 134,
    modifiers: { ...EMPTY_ANALYSIS_OFFENSE_MODIFIERS },
  };
}

describe('catalog-synergy', () => {
  it('derives strong DoT/Debuff synergy for Hysilens and Black Swan-like pairs', () => {
    const hysilens = createCharacter({
      id: 1,
      name: 'Hysilens',
      path: 'Nihility',
      roleText: 'DPS',
      tagKeys: ['DoT', 'Debuff', 'DPS', 'ATK-Scaller', 'EHR-Scaller'],
    });
    const blackSwan = createCharacter({
      id: 2,
      name: 'Cisne Negro',
      path: 'Nihility',
      roleText: 'Support-DPS',
      tagKeys: ['DoT', 'Debuff', 'Support-DPS', 'ATK-Scaller', 'EHR-Scaller'],
    });

    expect(deriveCatalogSynergyWeight(hysilens, blackSwan)).toBe(90);
  });

  it('derives DoT synergy for Hysilens and Kafka-like pairs without explicit rules', () => {
    const hysilens = createCharacter({
      id: 10,
      name: 'Hysilens',
      path: 'Nihility',
      roleText: 'DPS',
      tagKeys: ['DoT', 'Debuff', 'DPS', 'ATK-Scaller', 'EHR-Scaller'],
    });
    const kafka = createCharacter({
      id: 11,
      name: 'Kafka',
      path: 'Nihility',
      roleText: 'Support-DPS',
      tagKeys: ['DoT', 'Support-DPS', 'ATK-Scaller', 'HighSpeed'],
    });

    expect(deriveCatalogSynergyWeight(hysilens, kafka)).toBe(76);
  });

  it('derives strong follow-up carry/support synergy for Topaz and Robin-like pairs', () => {
    const topaz = createCharacter({
      id: 30,
      name: 'Topaz y Conti',
      path: 'Hunt',
      roleText: 'Support-DPS',
      tagKeys: ['Debuff', 'Support-DPS', 'ATK-Scaller'],
    });
    const robin = createCharacter({
      id: 31,
      name: 'Robin',
      path: 'Harmony',
      roleText: 'Amplifier',
      tagKeys: ['Advance', 'Buff', 'Amplifier', 'ATK-Scaller'],
    });

    expect(deriveCatalogSynergyWeight(topaz, robin)).toBe(82);
  });

  it('derives follow-up carry synergy for Feixiao and Topaz-like pairs without explicit tags', () => {
    const feixiao = createCharacter({
      id: 32,
      name: 'Feixiao',
      path: 'Hunt',
      roleText: 'DPS',
      tagKeys: ['DPS', 'ATK-Scaller'],
    });
    const topaz = createCharacter({
      id: 33,
      name: 'Topaz y Conti',
      path: 'Hunt',
      roleText: 'Support-DPS',
      tagKeys: ['Debuff', 'Support-DPS', 'ATK-Scaller'],
    });

    expect(deriveCatalogSynergyWeight(feixiao, topaz)).toBe(62);
  });

  it('derives strong counter support synergy for Yunli and Robin-like pairs', () => {
    const yunli = createCharacter({
      id: 34,
      name: 'Yunli',
      path: 'Destruction',
      roleText: 'DPS',
      tagKeys: ['DPS', 'ATK-Scaller', 'BaseSpeed'],
    });
    const robin = createCharacter({
      id: 35,
      name: 'Robin',
      path: 'Harmony',
      roleText: 'Amplifier',
      tagKeys: ['Advance', 'Buff', 'Amplifier', 'ATK-Scaller'],
    });

    expect(deriveCatalogSynergyWeight(yunli, robin)).toBe(78);
  });

  it('derives counter support synergy for Clara and Sparkle-like pairs', () => {
    const clara = createCharacter({
      id: 36,
      name: 'Clara',
      path: 'Destruction',
      roleText: 'DPS',
      tagKeys: ['DPS', 'ATK-Scaller'],
    });
    const sparkle = createCharacter({
      id: 37,
      name: 'Sparkle',
      path: 'Harmony',
      roleText: 'Amplifier',
      tagKeys: ['Advance', 'Buff', 'Amplifier', 'CritDMG-Scaller'],
    });

    expect(deriveCatalogSynergyWeight(clara, sparkle)).toBe(78);
  });

  it('derives premium summon support synergy for Jing Yuan and Sunday-like pairs', () => {
    const jingYuan = createCharacter({
      id: 38,
      name: 'Jing Yuan',
      path: 'Erudition',
      roleText: 'DPS',
      tagKeys: ['DPS', 'ATK-Scaller'],
    });
    const sunday = createCharacter({
      id: 39,
      name: 'Sunday',
      path: 'Harmony',
      roleText: 'Amplifier',
      tagKeys: ['Advance', 'Buff', 'Energy', 'Amplifier'],
    });

    expect(deriveCatalogSynergyWeight(jingYuan, sunday)).toBe(86);
  });

  it('derives summon support synergy for Aglaea and Remembrance Trailblazer-like pairs', () => {
    const aglaea = createCharacter({
      id: 40,
      name: 'Aglaea',
      path: 'Remembrance',
      roleText: 'DPS',
      tagKeys: ['Advance', 'SP-Friendly', 'DPS', 'ATK-Scaller'],
    });
    const remembranceTrailblazer = createCharacter({
      id: 41,
      name: 'Trazacaminos: Reminiscencia',
      path: 'Remembrance',
      roleText: 'Amplifier',
      tagKeys: ['Advance', 'Buff', 'Amplifier', 'CritDMG-Scaller'],
    });

    expect(deriveCatalogSynergyWeight(aglaea, remembranceTrailblazer)).toBe(72);
  });

  it('derives premium hypercarry support synergy for Imbibitor Lunae and Sparkle-like pairs', () => {
    const imbibitorLunae = createCharacter({
      id: 42,
      name: 'Dan Heng - Imbibitor Lunae',
      path: 'Destruction',
      roleText: 'DPS',
      tagKeys: ['SP-Unfriendly', 'DPS', 'ATK-Scaller'],
    });
    const sparkle = createCharacter({
      id: 43,
      name: 'Sparkle',
      path: 'Harmony',
      roleText: 'Amplifier',
      tagKeys: ['Advance', 'Buff', 'Amplifier', 'CritDMG-Scaller'],
    });

    expect(deriveCatalogSynergyWeight(imbibitorLunae, sparkle)).toBe(86);
  });

  it('derives strong hypercarry support synergy for Blade and Bronya-like pairs', () => {
    const blade = createCharacter({
      id: 44,
      name: 'Blade',
      path: 'Destruction',
      roleText: 'DPS',
      tagKeys: ['SP-Friendly', 'DPS', 'Support-DPS', 'HP-Scaller'],
    });
    const bronya = createCharacter({
      id: 45,
      name: 'Bronya',
      path: 'Harmony',
      roleText: 'Amplifier',
      tagKeys: ['Advance', 'Buff', 'Amplifier', 'CritDMG-Scaller'],
    });

    expect(deriveCatalogSynergyWeight(blade, bronya)).toBe(82);
  });

  it('preserves stronger explicit edges while adding derived edges for uncovered pairs', () => {
    const kafka = createCharacter({
      id: 20,
      name: 'Kafka',
      path: 'Nihility',
      roleText: 'Support-DPS',
      tagKeys: ['DoT', 'Support-DPS', 'ATK-Scaller', 'HighSpeed'],
    });
    const blackSwan = createCharacter({
      id: 21,
      name: 'Cisne Negro',
      path: 'Nihility',
      roleText: 'Support-DPS',
      tagKeys: ['DoT', 'Debuff', 'Support-DPS', 'ATK-Scaller', 'EHR-Scaller'],
    });
    const hysilens = createCharacter({
      id: 22,
      name: 'Hysilens',
      path: 'Nihility',
      roleText: 'DPS',
      tagKeys: ['DoT', 'Debuff', 'DPS', 'ATK-Scaller', 'EHR-Scaller'],
    });

    const merged = mergeDerivedSynergyEdges(
      [kafka, blackSwan, hysilens],
      [
        {
          sourceCharacterId: kafka.id,
          targetCharacterId: blackSwan.id,
          weight: 95,
        },
      ] satisfies SynergyEdge[],
      (source, target, weight) => ({
        sourceCharacterId: source.id,
        targetCharacterId: target.id,
        weight,
      }),
    );

    expect(merged).toEqual(
      expect.arrayContaining([
        {
          sourceCharacterId: kafka.id,
          targetCharacterId: blackSwan.id,
          weight: 95,
        },
        {
          sourceCharacterId: kafka.id,
          targetCharacterId: hysilens.id,
          weight: 76,
        },
        {
          sourceCharacterId: blackSwan.id,
          targetCharacterId: hysilens.id,
          weight: 90,
        },
      ]),
    );
  });
});
