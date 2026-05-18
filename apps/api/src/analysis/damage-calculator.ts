import {
  AnalysisCharacter,
  AnalysisOffenseModifiers,
  DamageProfile,
  DamageComparisonResult,
  EMPTY_ANALYSIS_OFFENSE_MODIFIERS,
  SynergyEdge,
  TeamDamageMember,
  TeamDamageResult,
  TeamRole,
} from './types';

const BASE_SPEED = 100;
const ACTION_GAUGE_BASE = 10000;

// Formula defaults based on standard same-level assumptions used in HSR theorycraft.
const DEFAULT_ATTACKER_LEVEL = 80;
const DEFAULT_TARGET_LEVEL = 80;
const DEFAULT_TARGET_RES = 0.2;
const DEFAULT_TOUGHNESS_REDUCTION = 0.1;

// Selection multipliers used by team builder scoring.
const ROLE_SELECTION_MULTIPLIER: Record<TeamRole, number> = {
  dps: 1.22,
  sub_dps: 1.08,
  support: 0.75,
  sustain: 0.62,
  unknown: 0.9,
};

const PROFILE_SELECTION_MULTIPLIER: Record<DamageProfile, number> = {
  single_target: 1.16,
  aoe: 1.08,
  dot: 1.12,
  burst: 1.2,
  utility: 0.84,
};

// Approximate per-action offensive coefficients by role/profile.
const ROLE_SKILL_MULTIPLIER: Record<TeamRole, number> = {
  dps: 1.0,
  sub_dps: 0.88,
  support: 0.52,
  sustain: 0.45,
  unknown: 0.74,
};

const PROFILE_SKILL_MULTIPLIER: Record<DamageProfile, number> = {
  single_target: 2.05,
  aoe: 1.75,
  dot: 1.42,
  burst: 2.3,
  utility: 1.0,
};

const PROFILE_EXTRA_MULTIPLIER: Record<DamageProfile, number> = {
  single_target: 0.12,
  aoe: 0.09,
  dot: 0.2,
  burst: 0.26,
  utility: 0.05,
};

const PROFILE_DMG_BONUS: Record<DamageProfile, number> = {
  single_target: 0.38,
  aoe: 0.3,
  dot: 0.35,
  burst: 0.45,
  utility: 0.2,
};

const ROLE_DMG_BONUS: Record<TeamRole, number> = {
  dps: 0.22,
  sub_dps: 0.13,
  support: 0.05,
  sustain: 0.03,
  unknown: 0.08,
};

const DOT_DMG_BONUS = 0.2;
const SYNERGY_TO_DMG_BONUS_FACTOR = 0.9;

type TeamCombatContext = {
  attackerLevel: number;
  targetLevel: number;
  targetRes: number;
  defReduction: number;
  defIgnore: number;
  resPen: number;
  dmgTakenBonus: number;
  universalDmgReduction: number;
  weaken: number;
};

function readModifiers(member: AnalysisCharacter): AnalysisOffenseModifiers {
  return member.modifiers ?? EMPTY_ANALYSIS_OFFENSE_MODIFIERS;
}

export function inferTeamRole(path: string, roleText: string): TeamRole {
  const text = `${path} ${roleText}`.toLowerCase();

  if (
    text.includes('abundance') ||
    text.includes('preservation') ||
    text.includes('sustain')
  ) {
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

  if (
    text.includes('sub') ||
    text.includes('follow-up') ||
    text.includes('dot')
  ) {
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

export function inferDamageProfile(
  path: string,
  roleText: string,
): DamageProfile {
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

  const averageWeight =
    pairWeights.reduce((acc, weight) => acc + weight, 0) / pairWeights.length;
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

function hasDebuffToolkit(member: TeamDamageMember): boolean {
  const text = `${member.path} ${member.roleText}`.toLowerCase();
  return (
    text.includes('nihility') || text.includes('debuff') || text.includes('dot')
  );
}

function buildTeamCombatContext(
  members: TeamDamageMember[],
): TeamCombatContext {
  const supportCount = members.filter(
    (member) => member.role === 'support',
  ).length;
  const debufferCount = members.filter((member) =>
    hasDebuffToolkit(member),
  ).length;
  const avgSpeed =
    members.reduce((sum, member) => sum + member.speed, 0) /
    Math.max(members.length, 1);

  const speedPressureBonus = avgSpeed >= 134 ? 0.02 : 0;

  return {
    attackerLevel: DEFAULT_ATTACKER_LEVEL,
    targetLevel: DEFAULT_TARGET_LEVEL,
    targetRes: DEFAULT_TARGET_RES,
    defReduction: clamp(
      0.08 * debufferCount + 0.03 * supportCount + speedPressureBonus,
      0,
      0.65,
    ),
    defIgnore: clamp(0.02 * debufferCount, 0, 0.35),
    resPen: clamp(0.05 * debufferCount + 0.02 * supportCount, 0, 0.55),
    dmgTakenBonus: clamp(0.06 * debufferCount + 0.03 * supportCount, 0, 0.6),
    universalDmgReduction: DEFAULT_TOUGHNESS_REDUCTION,
    weaken: 0,
  };
}

function calculateDefMultiplier(
  context: TeamCombatContext,
  memberDefIgnore: number,
): number {
  const defenseScaling = Math.max(
    0,
    1 - context.defReduction - context.defIgnore - memberDefIgnore,
  );
  const numerator = context.attackerLevel + 20;
  const denominator =
    (context.targetLevel + 20) * defenseScaling + (context.attackerLevel + 20);

  if (denominator <= 0) {
    return 1;
  }

  return numerator / denominator;
}

function calculateResMultiplier(
  context: TeamCombatContext,
  memberResPen: number,
): number {
  const effectiveRes = clamp(
    context.targetRes - context.resPen - memberResPen,
    -1,
    0.9,
  );
  return 1 - effectiveRes;
}

function calculateCritMultiplier(member: TeamDamageMember): number {
  if (member.profile === 'dot') {
    // DoT effects do not crit in HSR.
    return 1;
  }

  const modifiers = readModifiers(member);
  const critRate = clamp(member.critRate + modifiers.critRateFlat, 0, 1);
  const critDamage = Math.max(0, member.critDamage + modifiers.critDamageFlat);
  return 1 + critRate * critDamage;
}

function calculateActionFrequencyMultiplier(member: TeamDamageMember): number {
  const modifiers = readModifiers(member);
  const effectiveSpeed = Math.max(1, member.speed + modifiers.speedFlat);
  const actionValue = ACTION_GAUGE_BASE / effectiveSpeed;
  const actionsPer100AV = 100 / actionValue;
  return clamp(actionsPer100AV, 0.5, 2.8);
}

function calculateDmgPercentMultiplier(
  member: TeamDamageMember,
  context: TeamCombatContext,
): number {
  const modifiers = readModifiers(member);
  const dotBonus = member.profile === 'dot' ? DOT_DMG_BONUS : 0;
  const otherBonus =
    (member.synergyMultiplier - 1) * SYNERGY_TO_DMG_BONUS_FACTOR +
    Math.max(0, context.resPen * 0.25);

  return (
    1 +
    PROFILE_DMG_BONUS[member.profile] +
    ROLE_DMG_BONUS[member.role] +
    dotBonus +
    modifiers.dmgBonus +
    (member.profile === 'dot' ? modifiers.dotBonus : 0) +
    Math.max(0, otherBonus)
  );
}

function calculateBaseDamage(member: TeamDamageMember): number {
  const modifiers = readModifiers(member);
  const skillMultiplier =
    ROLE_SKILL_MULTIPLIER[member.role] *
    PROFILE_SKILL_MULTIPLIER[member.profile];
  const extraMultiplier = PROFILE_EXTRA_MULTIPLIER[member.profile];

  const effectiveAtk = Math.max(1, member.atk * (1 + modifiers.atkPercent));
  return (skillMultiplier + extraMultiplier) * effectiveAtk;
}

function damagePerCharacter(
  member: TeamDamageMember,
  context: TeamCombatContext,
): number {
  const modifiers = readModifiers(member);
  const baseDamage = calculateBaseDamage(member);
  const dmgPercentMultiplier = calculateDmgPercentMultiplier(member, context);
  const defMultiplier = calculateDefMultiplier(context, modifiers.defIgnore);
  const resMultiplier = calculateResMultiplier(context, modifiers.resPen);
  const dmgTakenMultiplier = 1 + context.dmgTakenBonus;
  const universalDmgReductionMultiplier =
    1 - clamp(context.universalDmgReduction, 0, 0.95);
  const weakenMultiplier = 1 - clamp(context.weaken, 0, 1);
  const critMultiplier = calculateCritMultiplier(member);
  const actionsMultiplier = calculateActionFrequencyMultiplier(member);

  const outgoingPerAction =
    baseDamage *
    dmgPercentMultiplier *
    defMultiplier *
    resMultiplier *
    dmgTakenMultiplier *
    universalDmgReductionMultiplier *
    weakenMultiplier *
    critMultiplier;

  return outgoingPerAction * actionsMultiplier;
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
      profileMultiplier: PROFILE_SELECTION_MULTIPLIER[profile],
    };
  });

  const roleBonus = roleCoverageBonus(members);
  const profileBonus = profileCoverageBonus(members);
  const teamCombatContext = buildTeamCombatContext(members);

  const memberDamageRows = members.map((member) => {
    const dmgPercentMultiplier = calculateDmgPercentMultiplier(
      member,
      teamCombatContext,
    );

    return {
      id: member.id,
      name: member.name,
      role: member.role,
      profile: member.profile,
      damage: damagePerCharacter(member, teamCombatContext),
      synergyMultiplier: member.synergyMultiplier,
      profileMultiplier: Number(dmgPercentMultiplier.toFixed(4)),
    };
  });

  const totalDamage =
    memberDamageRows.reduce((acc, row) => acc + row.damage, 0) *
    roleBonus *
    profileBonus;

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
  const modifiers = readModifiers(character);
  const critRate = clamp(character.critRate + modifiers.critRateFlat, 0, 1);
  const critDamage = Math.max(
    0,
    character.critDamage + modifiers.critDamageFlat,
  );
  const effectiveAtk = Math.max(1, character.atk * (1 + modifiers.atkPercent));
  const effectiveSpeed = Math.max(1, character.speed + modifiers.speedFlat);
  const role = inferTeamRole(character.path, character.roleText);
  const profile = inferDamageProfile(character.path, character.roleText);

  const base =
    effectiveAtk *
    (1 + critRate * critDamage) *
    (1 + (effectiveSpeed - BASE_SPEED) / 400) *
    (1 + modifiers.dmgBonus + (profile === 'dot' ? modifiers.dotBonus : 0));
  return (
    base *
    ROLE_SELECTION_MULTIPLIER[role] *
    PROFILE_SELECTION_MULTIPLIER[profile]
  );
}

function hasForcedSynergyLink(
  candidateId: number,
  forcedId: number | undefined,
  synergyMap: Map<string, number>,
): boolean {
  if (typeof forcedId !== 'number') {
    return false;
  }

  const weight = readPairSynergyWeight(candidateId, forcedId, synergyMap);
  return typeof weight === 'number' && weight > 0;
}

function rankByTeamSelection(
  a: AnalysisCharacter,
  b: AnalysisCharacter,
  selectedIds: number[],
  forcedId: number | undefined,
  synergyMap: Map<string, number>,
) {
  const aScore = scoreForTeamSelection(a, selectedIds, forcedId, synergyMap);
  const bScore = scoreForTeamSelection(b, selectedIds, forcedId, synergyMap);
  return bScore - aScore;
}

function pickBestCandidate(
  roster: AnalysisCharacter[],
  excludedIds: Set<number>,
  selectedIds: number[],
  forcedId: number | undefined,
  synergyMap: Map<string, number>,
  desiredRole?: TeamRole,
  preferForcedLinkedMembers = false,
): AnalysisCharacter | null {
  const candidates = roster.filter((character) => {
    if (excludedIds.has(character.id)) {
      return false;
    }

    if (
      desiredRole &&
      inferTeamRole(character.path, character.roleText) !== desiredRole
    ) {
      return false;
    }

    return true;
  });

  if (candidates.length === 0) {
    return null;
  }

  const linkedCandidates =
    preferForcedLinkedMembers && typeof forcedId === 'number'
      ? candidates.filter((candidate) =>
          hasForcedSynergyLink(candidate.id, forcedId, synergyMap),
        )
      : [];

  const pool = linkedCandidates.length > 0 ? linkedCandidates : candidates;

  return pool.sort((a, b) =>
    rankByTeamSelection(a, b, selectedIds, forcedId, synergyMap),
  )[0];
}

function pickBestByRole(
  roster: AnalysisCharacter[],
  desiredRole: TeamRole,
  excludedIds: Set<number>,
  selectedIds: number[],
  forcedId: number | undefined,
  synergyMap: Map<string, number>,
  preferForcedLinkedMembers = false,
): AnalysisCharacter | null {
  return pickBestCandidate(
    roster,
    excludedIds,
    selectedIds,
    forcedId,
    synergyMap,
    desiredRole,
    preferForcedLinkedMembers,
  );
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
  const selectedSynergyMultiplier =
    1 + clamp((avgSelectedSynergy - 50) / 130, -0.2, 0.36);

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
    typeof forcedId === 'number' &&
    candidate.id !== forcedId &&
    forcedSynergy === 0
      ? 0.72
      : 1;

  return (
    baseScore *
    selectedSynergyMultiplier *
    forcedSynergyMultiplier *
    noForcedSynergyPenalty
  );
}

function hasSelectedRole(
  selected: AnalysisCharacter[],
  desiredRole: TeamRole,
): boolean {
  return selected.some(
    (member) => inferTeamRole(member.path, member.roleText) === desiredRole,
  );
}

export function buildTeamWithLockedMembers(
  roster: AnalysisCharacter[],
  lockedMemberIds: number[],
  forcedId?: number,
  synergyEdges: SynergyEdge[] = [],
): AnalysisCharacter[] {
  const synergyMap = buildSynergyMap(synergyEdges);
  const selected: AnalysisCharacter[] = [];
  const usedIds = new Set<number>();
  const uniqueLockedIds = [...new Set(lockedMemberIds)];
  const orderedLockedIds =
    typeof forcedId === 'number'
      ? [forcedId, ...uniqueLockedIds.filter((id) => id !== forcedId)]
      : uniqueLockedIds;

  for (const lockedId of orderedLockedIds) {
    const member = roster.find((character) => character.id === lockedId);
    if (!member || usedIds.has(member.id)) {
      continue;
    }

    selected.push(member);
    usedIds.add(member.id);
  }

  if (selected.length >= 4) {
    return selected.slice(0, 4);
  }

  const remainingSlots = () => Math.max(0, 4 - selected.length);

  const linkedCandidatesRemaining = () =>
    typeof forcedId === 'number'
      ? roster.filter(
          (candidate) =>
            !usedIds.has(candidate.id) &&
            candidate.id !== forcedId &&
            hasForcedSynergyLink(candidate.id, forcedId, synergyMap),
        ).length
      : 0;

  // Use forced-target links as a hard preference only when enough linked members
  // exist to complete the remaining team slots.
  const shouldPreferForcedLinks = () =>
    typeof forcedId === 'number' &&
    linkedCandidatesRemaining() >= remainingSlots();

  const tryAddByRole = (desiredRole: TeamRole) => {
    if (selected.length >= 4) {
      return;
    }

    const next = pickBestByRole(
      roster,
      desiredRole,
      usedIds,
      selected.map((member) => member.id),
      forcedId,
      synergyMap,
      shouldPreferForcedLinks(),
    );

    if (next) {
      selected.push(next);
      usedIds.add(next.id);
    }
  };

  if (!hasSelectedRole(selected, 'sustain')) {
    tryAddByRole('sustain');
  }

  if (!hasSelectedRole(selected, 'support')) {
    tryAddByRole('support');
  }

  while (selected.length < 4) {
    const next = pickBestCandidate(
      roster,
      usedIds,
      selected.map((member) => member.id),
      forcedId,
      synergyMap,
      undefined,
      shouldPreferForcedLinks(),
    );

    if (!next) {
      break;
    }

    selected.push(next);
    usedIds.add(next.id);
  }

  return selected.slice(0, 4);
}

export function buildBalancedTeam(
  roster: AnalysisCharacter[],
  forcedId?: number,
  synergyEdges: SynergyEdge[] = [],
): AnalysisCharacter[] {
  const lockedIds = typeof forcedId === 'number' ? [forcedId] : [];
  return buildTeamWithLockedMembers(roster, lockedIds, forcedId, synergyEdges);
}

export function countCompatibleTeams(
  roster: AnalysisCharacter[],
  targetCharacterId: number,
): number {
  const others = roster.filter(
    (character) => character.id !== targetCharacterId,
  );
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

        const roles = new Set(
          team.map((member) => inferTeamRole(member.path, member.roleText)),
        );
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
