import {
  AnalysisCharacter,
  DamageProfile,
  DamageComparisonResult,
  SynergyEdge,
  TeamDamageMember,
  TeamDamageResult,
  TeamRole,
} from './types';

const BASE_SPEED = 100;

const ROLE_MULTIPLIER: Record<TeamRole, number> = {
  dps: 1.22,
  sub_dps: 1.08,
  support: 0.75,
  sustain: 0.62,
  unknown: 0.9,
};

const PROFILE_MULTIPLIER: Record<DamageProfile, number> = {
  single_target: 1.16,
  aoe: 1.08,
  dot: 1.12,
  burst: 1.2,
  utility: 0.84,
};

export function inferTeamRole(path: string, roleText: string): TeamRole {
  const text = `${path} ${roleText}`.toLowerCase();

  if (text.includes('abundance') || text.includes('preservation') || text.includes('sustain')) {
    return 'sustain';
  }

  if (
    text.includes('harmony') ||
    text.includes('support') ||
    text.includes('buffer') ||
    text.includes('debuff')
  ) {
    return 'support';
  }

  if (text.includes('sub') || text.includes('follow-up') || text.includes('dot')) {
    return 'sub_dps';
  }

  if (
    text.includes('dps') ||
    text.includes('hunt') ||
    text.includes('destruction') ||
    text.includes('erudition')
  ) {
    return 'dps';
  }

  return 'unknown';
}

export function inferDamageProfile(path: string, roleText: string): DamageProfile {
  const text = `${path} ${roleText}`.toLowerCase();

  if (text.includes('dot') || text.includes('nihility')) {
    return 'dot';
  }

  if (text.includes('burst') || text.includes('hypercarry')) {
    return 'burst';
  }

  if (
    text.includes('aoe') ||
    text.includes('erudition') ||
    text.includes('teamwide')
  ) {
    return 'aoe';
  }

  if (
    text.includes('single') ||
    text.includes('hunt') ||
    text.includes('follow-up')
  ) {
    return 'single_target';
  }

  if (
    text.includes('support') ||
    text.includes('sustain') ||
    text.includes('harmony') ||
    text.includes('abundance') ||
    text.includes('preservation')
  ) {
    return 'utility';
  }

  return 'single_target';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function damagePerCharacter(member: TeamDamageMember): number {
  const critRate = clamp(member.critRate, 0, 1);
  const critDamage = Math.max(0, member.critDamage);
  const critMultiplier = 1 + critRate * critDamage;

  const speedDelta = (member.speed - BASE_SPEED) / 220;
  const speedMultiplier = 1 + clamp(speedDelta, -0.15, 0.5);

  const roleMultiplier = ROLE_MULTIPLIER[member.role];
  const profileMultiplier = member.profileMultiplier;

  return (
    member.atk *
    critMultiplier *
    speedMultiplier *
    roleMultiplier *
    profileMultiplier *
    member.synergyMultiplier
  );
}

function buildSynergyMap(edges: SynergyEdge[]): Map<string, number> {
  const map = new Map<string, number>();

  for (const edge of edges) {
    map.set(`${edge.sourceCharacterId}:${edge.targetCharacterId}`, edge.weight);
  }

  return map;
}

function readPairSynergyWeight(
  sourceId: number,
  targetId: number,
  synergyMap: Map<string, number>,
): number | null {
  const direct = synergyMap.get(`${sourceId}:${targetId}`);
  if (typeof direct === 'number') return direct;

  const inverse = synergyMap.get(`${targetId}:${sourceId}`);
  if (typeof inverse === 'number') return inverse;

  return null;
}

function averageSynergyWithGroup(
  memberId: number,
  groupIds: number[],
  synergyMap: Map<string, number>,
): number {
  const weights: number[] = [];

  for (const otherId of groupIds) {
    if (otherId === memberId) continue;

    const weight = readPairSynergyWeight(memberId, otherId, synergyMap);
    if (typeof weight === 'number') {
      weights.push(weight);
    }
  }

  if (weights.length === 0) {
    return 0;
  }

  return weights.reduce((acc, weight) => acc + weight, 0) / weights.length;
}

function calculateMemberSynergyMultiplier(
  memberId: number,
  teamMemberIds: number[],
  synergyMap: Map<string, number>,
): number {
  const pairWeights: number[] = [];

  for (const otherId of teamMemberIds) {
    if (otherId === memberId) continue;

    const weight = readPairSynergyWeight(memberId, otherId, synergyMap);
    if (typeof weight === 'number') {
      pairWeights.push(weight);
    }
  }

  if (pairWeights.length === 0) {
    return 1;
  }

  const averageWeight = pairWeights.reduce((acc, weight) => acc + weight, 0) / pairWeights.length;
  return 1 + clamp((averageWeight - 50) / 300, -0.08, 0.18);
}

function roleCoverageBonus(team: TeamDamageMember[]): number {
  const roles = new Set(team.map((member) => member.role));
  const hasDps = roles.has('dps') || roles.has('sub_dps');
  const hasSupport = roles.has('support');
  const hasSustain = roles.has('sustain');

  if (hasDps && hasSupport && hasSustain) {
    return 1.08;
  }

  if (hasDps && (hasSupport || hasSustain)) {
    return 1.03;
  }

  return 0.95;
}

function profileCoverageBonus(team: TeamDamageMember[]): number {
  const profiles = team.map((member) => member.profile);
  const hasDot = profiles.includes('dot');
  const hasBurst = profiles.includes('burst');
  const hasAoe = profiles.includes('aoe');
  const hasSt = profiles.includes('single_target');

  if ((hasDot || hasBurst) && (hasAoe || hasSt)) {
    return 1.06;
  }

  if (hasAoe || hasSt || hasDot || hasBurst) {
    return 1.02;
  }

  return 0.96;
}

export function calculateTeamDamage(
  team: AnalysisCharacter[],
  synergyEdges: SynergyEdge[],
): TeamDamageResult {
  const synergyMap = buildSynergyMap(synergyEdges);
  const teamMemberIds = team.map((member) => member.id);

  const members: TeamDamageMember[] = team.map((member) => {
    const role = inferTeamRole(member.path, member.roleText);
    const profile = inferDamageProfile(member.path, member.roleText);
    const synergyMultiplier = calculateMemberSynergyMultiplier(
      member.id,
      teamMemberIds,
      synergyMap,
    );

    return {
      ...member,
      role,
      profile,
      synergyMultiplier,
      profileMultiplier: PROFILE_MULTIPLIER[profile],
    };
  });

  const roleBonus = roleCoverageBonus(members);
  const profileBonus = profileCoverageBonus(members);

  const memberDamageRows = members.map((member) => ({
    id: member.id,
    name: member.name,
    role: member.role,
    profile: member.profile,
    damage: damagePerCharacter(member),
    synergyMultiplier: member.synergyMultiplier,
    profileMultiplier: member.profileMultiplier,
  }));

  const totalDamage =
    memberDamageRows.reduce((acc, row) => acc + row.damage, 0) * roleBonus * profileBonus;

  return {
    totalDamage,
    roleCoverageBonus: roleBonus,
    profileCoverageBonus: profileBonus,
    members: memberDamageRows,
  };
}

export function compareTeamDamage(
  currentTeam: AnalysisCharacter[],
  proposedTeam: AnalysisCharacter[],
  synergyEdges: SynergyEdge[],
): DamageComparisonResult {
  const current = calculateTeamDamage(currentTeam, synergyEdges);
  const proposed = calculateTeamDamage(proposedTeam, synergyEdges);

  const deltaAbsolute = proposed.totalDamage - current.totalDamage;
  const deltaPercent =
    current.totalDamage <= 0
      ? proposed.totalDamage > 0
        ? 100
        : 0
      : Number(((deltaAbsolute / current.totalDamage) * 100).toFixed(2));

  return {
    currentTeam: current,
    proposedTeam: proposed,
    deltaAbsolute: Number(deltaAbsolute.toFixed(2)),
    deltaPercent,
  };
}

function scoreForSelection(character: AnalysisCharacter): number {
  const critRate = clamp(character.critRate, 0, 1);
  const critDamage = Math.max(0, character.critDamage);
  const role = inferTeamRole(character.path, character.roleText);
  const profile = inferDamageProfile(character.path, character.roleText);

  const base = character.atk * (1 + critRate * critDamage) * (1 + (character.speed - BASE_SPEED) / 400);
  return base * ROLE_MULTIPLIER[role] * PROFILE_MULTIPLIER[profile];
}

function pickBestByRole(
  roster: AnalysisCharacter[],
  desiredRole: TeamRole,
  excludedIds: Set<number>,
  selectedIds: number[],
  forcedId: number | undefined,
  synergyMap: Map<string, number>,
): AnalysisCharacter | null {
  const candidates = roster.filter((character) => {
    if (excludedIds.has(character.id)) return false;
    return inferTeamRole(character.path, character.roleText) === desiredRole;
  });

  if (candidates.length === 0) {
    return null;
  }

  return candidates.sort((a, b) => {
    const aScore = scoreForTeamSelection(a, selectedIds, forcedId, synergyMap);
    const bScore = scoreForTeamSelection(b, selectedIds, forcedId, synergyMap);
    return bScore - aScore;
  })[0];
}

function scoreForTeamSelection(
  candidate: AnalysisCharacter,
  selectedIds: number[],
  forcedId: number | undefined,
  synergyMap: Map<string, number>,
): number {
  const baseScore = scoreForSelection(candidate);
  if (selectedIds.length === 0) {
    return baseScore;
  }

  const avgSelectedSynergy = averageSynergyWithGroup(
    candidate.id,
    selectedIds,
    synergyMap,
  );
  const selectedSynergyMultiplier = 1 + clamp((avgSelectedSynergy - 50) / 130, -0.2, 0.36);

  const forcedSynergy =
    typeof forcedId === 'number'
      ? averageSynergyWithGroup(candidate.id, [forcedId], synergyMap)
      : 0;

  const forcedSynergyMultiplier =
    typeof forcedId === 'number'
      ? 1 + clamp((forcedSynergy - 50) / 85, -0.35, 0.58)
      : 1;

  // If a forced target exists, down-rank candidates with no direct link to it.
  const noForcedSynergyPenalty =
    typeof forcedId === 'number' && candidate.id !== forcedId && forcedSynergy === 0
      ? 0.72
      : 1;

  return (
    baseScore *
    selectedSynergyMultiplier *
    forcedSynergyMultiplier *
    noForcedSynergyPenalty
  );
}

export function buildBalancedTeam(
  roster: AnalysisCharacter[],
  forcedId?: number,
  synergyEdges: SynergyEdge[] = [],
): AnalysisCharacter[] {
  const synergyMap = buildSynergyMap(synergyEdges);
  const selected: AnalysisCharacter[] = [];
  const usedIds = new Set<number>();

  if (typeof forcedId === 'number') {
    const forcedCharacter = roster.find((character) => character.id === forcedId);
    if (forcedCharacter) {
      selected.push(forcedCharacter);
      usedIds.add(forcedCharacter.id);
    }
  }

  const sustain = pickBestByRole(
    roster,
    'sustain',
    usedIds,
    selected.map((member) => member.id),
    forcedId,
    synergyMap,
  );
  if (sustain) {
    selected.push(sustain);
    usedIds.add(sustain.id);
  }

  const support = pickBestByRole(
    roster,
    'support',
    usedIds,
    selected.map((member) => member.id),
    forcedId,
    synergyMap,
  );
  if (support) {
    selected.push(support);
    usedIds.add(support.id);
  }

  while (selected.length < 4) {
    const selectedIds = selected.map((member) => member.id);
    const remaining = roster.filter((candidate) => !usedIds.has(candidate.id));
    if (remaining.length === 0) {
      break;
    }

    const next = remaining.sort((a, b) => {
      const aScore = scoreForTeamSelection(a, selectedIds, forcedId, synergyMap);
      const bScore = scoreForTeamSelection(b, selectedIds, forcedId, synergyMap);
      return bScore - aScore;
    })[0];

    selected.push(next);
    usedIds.add(next.id);
  }

  return selected.slice(0, 4);
}

export function countCompatibleTeams(
  roster: AnalysisCharacter[],
  targetCharacterId: number,
): number {
  const others = roster.filter((character) => character.id !== targetCharacterId);
  if (others.length < 3) {
    return 1;
  }

  let validTeams = 0;

  for (let i = 0; i < others.length - 2; i += 1) {
    for (let j = i + 1; j < others.length - 1; j += 1) {
      for (let k = j + 1; k < others.length; k += 1) {
        const team = [
          roster.find((character) => character.id === targetCharacterId),
          others[i],
          others[j],
          others[k],
        ].filter(Boolean) as AnalysisCharacter[];

        const roles = new Set(team.map((member) => inferTeamRole(member.path, member.roleText)));
        const hasDps = roles.has('dps') || roles.has('sub_dps');
        const hasSupport = roles.has('support');

        if (hasDps && hasSupport) {
          validTeams += 1;
          if (validTeams >= 4) return 4;
        }
      }
    }
  }

  return Math.max(1, validTeams);
}
