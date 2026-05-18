import {
  AnalysisOffenseModifiers,
  EMPTY_ANALYSIS_OFFENSE_MODIFIERS,
} from './types';

type EquippedLightCone = {
  name: string;
  path: string;
  rarity: number;
  effectDescription?: string | null;
  level?: number | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function mergeModifiers(
  base: AnalysisOffenseModifiers,
  extra: Partial<AnalysisOffenseModifiers>,
): AnalysisOffenseModifiers {
  return {
    atkPercent: base.atkPercent + (extra.atkPercent ?? 0),
    critRateFlat: base.critRateFlat + (extra.critRateFlat ?? 0),
    critDamageFlat: base.critDamageFlat + (extra.critDamageFlat ?? 0),
    speedFlat: base.speedFlat + (extra.speedFlat ?? 0),
    dmgBonus: base.dmgBonus + (extra.dmgBonus ?? 0),
    dotBonus: base.dotBonus + (extra.dotBonus ?? 0),
    defIgnore: base.defIgnore + (extra.defIgnore ?? 0),
    resPen: base.resPen + (extra.resPen ?? 0),
  };
}

function rarityMultiplier(rarity: number): number {
  if (rarity >= 5) return 1;
  if (rarity === 4) return 0.84;
  return 0.72;
}

function levelMultiplier(level: number | null | undefined): number {
  const normalized = clamp((level ?? 80) / 80, 0.2, 1);
  return 0.65 + normalized * 0.35;
}

function baseAtkPassive(rarity: number): number {
  if (rarity >= 5) return 0.16;
  if (rarity === 4) return 0.11;
  return 0.07;
}

function pathAbilityBaseline(path: string): Partial<AnalysisOffenseModifiers> {
  const normalized = path.toLowerCase();

  if (normalized === 'nihility') {
    return {
      dmgBonus: 0.1,
      dotBonus: 0.14,
      atkPercent: 0.04,
    };
  }

  if (normalized === 'harmony') {
    return {
      dmgBonus: 0.06,
      speedFlat: 3,
      atkPercent: 0.03,
    };
  }

  if (normalized === 'hunt') {
    return {
      critRateFlat: 0.08,
      critDamageFlat: 0.14,
      dmgBonus: 0.07,
    };
  }

  if (normalized === 'destruction') {
    return {
      atkPercent: 0.1,
      dmgBonus: 0.08,
    };
  }

  if (normalized === 'erudition') {
    return {
      dmgBonus: 0.12,
      atkPercent: 0.05,
    };
  }

  if (normalized === 'preservation') {
    return {
      dmgBonus: 0.03,
      defIgnore: 0.02,
    };
  }

  if (normalized === 'abundance') {
    return {
      dmgBonus: 0.04,
      speedFlat: 2,
    };
  }

  return {};
}

function keywordModifiers(text: string): Partial<AnalysisOffenseModifiers> {
  let modifiers: AnalysisOffenseModifiers = {
    ...EMPTY_ANALYSIS_OFFENSE_MODIFIERS,
  };

  if (text.includes('crit')) {
    modifiers = mergeModifiers(modifiers, {
      critRateFlat: 0.03,
      critDamageFlat: 0.08,
    });
  }

  if (text.includes('dot')) {
    modifiers = mergeModifiers(modifiers, {
      dotBonus: 0.12,
      dmgBonus: 0.04,
    });
  }

  if (text.includes('debuff')) {
    modifiers = mergeModifiers(modifiers, {
      dmgBonus: 0.05,
    });
  }

  if (text.includes('speed')) {
    modifiers = mergeModifiers(modifiers, {
      speedFlat: 2,
    });
  }

  if (text.includes('follow-up')) {
    modifiers = mergeModifiers(modifiers, {
      dmgBonus: 0.07,
    });
  }

  if (text.includes('atk') || text.includes('attack')) {
    modifiers = mergeModifiers(modifiers, {
      atkPercent: 0.07,
    });
  }

  if (
    text.includes('def reduced') ||
    text.includes('def reduction') ||
    text.includes('def shred')
  ) {
    modifiers = mergeModifiers(modifiers, {
      defIgnore: 0.06,
    });
  }

  if (text.includes('slow')) {
    modifiers = mergeModifiers(modifiers, {
      resPen: 0.03,
    });
  }

  return modifiers;
}

function namedConeModifiers(name: string): Partial<AnalysisOffenseModifiers> {
  const normalized = name.toLowerCase();

  if (normalized === 'along the passing shore') {
    return { critRateFlat: 0.1, critDamageFlat: 0.16, dmgBonus: 0.12 };
  }

  if (normalized === 'good night and sleep well') {
    return { dmgBonus: 0.16, dotBonus: 0.1 };
  }

  if (normalized === 'eyes of the prey') {
    return { dotBonus: 0.2, dmgBonus: 0.06 };
  }

  if (normalized === 'patience is all you need') {
    return { speedFlat: 6, dmgBonus: 0.12, dotBonus: 0.12 };
  }

  if (normalized === 'earthly escapade') {
    return { critDamageFlat: 0.16, dmgBonus: 0.08 };
  }

  if (normalized === 'on the fall of an aeon') {
    return { atkPercent: 0.16, dmgBonus: 0.08 };
  }

  if (normalized === 'worrisome, blissful') {
    return { critRateFlat: 0.08, dmgBonus: 0.12 };
  }

  if (normalized === 'cruising in the stellar sea') {
    return { critRateFlat: 0.08, critDamageFlat: 0.08 };
  }

  return {};
}

function scaleModifierSet(
  modifiers: Partial<AnalysisOffenseModifiers>,
  scale: number,
): Partial<AnalysisOffenseModifiers> {
  return {
    atkPercent: (modifiers.atkPercent ?? 0) * scale,
    critRateFlat: (modifiers.critRateFlat ?? 0) * scale,
    critDamageFlat: (modifiers.critDamageFlat ?? 0) * scale,
    speedFlat: (modifiers.speedFlat ?? 0) * scale,
    dmgBonus: (modifiers.dmgBonus ?? 0) * scale,
    dotBonus: (modifiers.dotBonus ?? 0) * scale,
    defIgnore: (modifiers.defIgnore ?? 0) * scale,
    resPen: (modifiers.resPen ?? 0) * scale,
  };
}

export function resolveEquippedLightConeModifiers(input: {
  characterPath: string;
  lightCone: EquippedLightCone | null;
}): AnalysisOffenseModifiers {
  if (!input.lightCone) {
    return { ...EMPTY_ANALYSIS_OFFENSE_MODIFIERS };
  }

  const levelScale = levelMultiplier(input.lightCone.level);
  const rarityScale = rarityMultiplier(input.lightCone.rarity);
  const baseAtkScale = levelScale * rarityScale;

  let total = mergeModifiers(EMPTY_ANALYSIS_OFFENSE_MODIFIERS, {
    atkPercent: baseAtkPassive(input.lightCone.rarity) * baseAtkScale,
  });

  if (
    input.lightCone.path.toLowerCase() !== input.characterPath.toLowerCase()
  ) {
    return total;
  }

  const abilityScale = levelScale * rarityScale;
  total = mergeModifiers(
    total,
    scaleModifierSet(pathAbilityBaseline(input.lightCone.path), abilityScale),
  );

  const keywordText =
    `${input.lightCone.name} ${input.lightCone.effectDescription ?? ''}`.toLowerCase();
  total = mergeModifiers(
    total,
    scaleModifierSet(keywordModifiers(keywordText), abilityScale),
  );

  total = mergeModifiers(
    total,
    scaleModifierSet(namedConeModifiers(input.lightCone.name), abilityScale),
  );

  return total;
}

export function buildFallbackPathConeModifiers(
  characterPath: string,
): AnalysisOffenseModifiers {
  return resolveEquippedLightConeModifiers({
    characterPath,
    lightCone: {
      name: 'Fallback Path Cone',
      path: characterPath,
      rarity: 4,
      effectDescription: 'Generic path-compatible training light cone.',
      level: 80,
    },
  });
}
