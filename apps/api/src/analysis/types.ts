import type {
  CharacterStatMap,
  CharacterStatProfile,
} from '../characters/character-catalog';

export type TeamRole = 'dps' | 'sub_dps' | 'support' | 'sustain' | 'unknown';

export type DamageProfile =
  | 'single_target'
  | 'aoe'
  | 'dot'
  | 'burst'
  | 'utility';

export type AnalysisOffenseModifiers = {
  atkPercent: number;
  critRateFlat: number;
  critDamageFlat: number;
  speedFlat: number;
  dmgBonus: number;
  dotBonus: number;
  defIgnore: number;
  resPen: number;
};

export const EMPTY_ANALYSIS_OFFENSE_MODIFIERS: AnalysisOffenseModifiers = {
  atkPercent: 0,
  critRateFlat: 0,
  critDamageFlat: 0,
  speedFlat: 0,
  dmgBonus: 0,
  dotBonus: 0,
  defIgnore: 0,
  resPen: 0,
};

export type AnalysisCharacter = {
  id: number;
  name: string;
  path: string;
  element: string;
  roleText: string;
  tagKeys: string[];
  statProfile: CharacterStatProfile;
  stats: CharacterStatMap;
  hp: number;
  atk: number;
  def: number;
  critRate: number;
  critDamage: number;
  breakEffect: number;
  energyRegenRate: number;
  effectHitRate: number;
  effectRes: number;
  elementalDmgBonus: number;
  speed: number;
  modifiers: AnalysisOffenseModifiers;
};

export type TeamDamageMember = AnalysisCharacter & {
  role: TeamRole;
  profile: DamageProfile;
  synergyMultiplier: number;
  profileMultiplier: number;
};

export type TeamDamageResult = {
  totalDamage: number;
  roleCoverageBonus: number;
  profileCoverageBonus: number;
  members: Array<{
    id: number;
    name: string;
    role: TeamRole;
    profile: DamageProfile;
    damage: number;
    synergyMultiplier: number;
    profileMultiplier: number;
  }>;
};

export type DamageComparisonResult = {
  currentTeam: TeamDamageResult;
  proposedTeam: TeamDamageResult;
  deltaAbsolute: number;
  deltaPercent: number;
};

export type SynergyEdge = {
  sourceCharacterId: number;
  targetCharacterId: number;
  weight: number;
};
