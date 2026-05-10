export type TeamRole =
  | 'dps'
  | 'sub_dps'
  | 'support'
  | 'sustain'
  | 'unknown';

export type DamageProfile =
  | 'single_target'
  | 'aoe'
  | 'dot'
  | 'burst'
  | 'utility';

export type AnalysisCharacter = {
  id: number;
  name: string;
  path: string;
  roleText: string;
  atk: number;
  critRate: number;
  critDamage: number;
  speed: number;
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
