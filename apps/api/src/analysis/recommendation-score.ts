import type { TeamRole } from './types';

export type RecommendationFactorScores = {
  damageScore: number;
  synergyScore: number;
  teamScore: number;
  roleScore: number;
  investmentScore: number;
  accountValueScore: number;
};

export type RecommendationScoreBreakdown = {
  damageContribution: number;
  synergyContribution: number;
  teamContribution: number;
  roleContribution: number;
  investmentContribution: number;
  accountValueContribution: number;
};

export type RecommendationScoreInput = {
  deltaPercent: number;
  synergyScore: number;
  synergyCount: number;
  compatibleTeams: number;
  sameRoleCount: number;
  alreadyOwned: boolean;
  targetRole: TeamRole;
  singleStrongLinkSupportOpportunity?: boolean;
};

const RECOMMENDATION_WEIGHTS = {
  damageScore: 0.25,
  synergyScore: 0.2,
  teamScore: 0.2,
  roleScore: 0.15,
  investmentScore: 0.1,
  accountValueScore: 0.1,
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function weighted(score: number, weight: number) {
  return Number((score * weight).toFixed(2));
}

export function calculateDamageScore(deltaPercent: number) {
  if (deltaPercent <= 0) return 0;
  if (deltaPercent <= 10) return 40;
  if (deltaPercent <= 25) return 65;
  if (deltaPercent <= 40) return 85;
  return 100;
}

export function calculateSynergyFactorScore(
  synergyScore: number,
  synergyCount: number,
) {
  if (synergyCount <= 0 || synergyScore <= 0) return 0;
  if (synergyScore >= 85 || (synergyScore >= 75 && synergyCount >= 2)) {
    return 100;
  }
  if (synergyScore >= 70) return 85;
  if (synergyScore >= 45) return 65;
  return 40;
}

export function calculateTeamScore(
  compatibleTeams: number,
  singleStrongLinkSupportOpportunity = false,
) {
  if (compatibleTeams <= 0) {
    return singleStrongLinkSupportOpportunity ? 45 : 0;
  }
  if (compatibleTeams === 1) return 45;
  if (compatibleTeams === 2) return 75;
  return 100;
}

export function calculateRoleScore(
  sameRoleCount: number,
  targetRole: TeamRole,
) {
  if (sameRoleCount <= 0) {
    return 100;
  }

  if (targetRole === 'support' || targetRole === 'sustain') {
    if (sameRoleCount === 1) return 90;
    if (sameRoleCount === 2) return 75;
    return 55;
  }

  if (sameRoleCount === 1) return 80;
  if (sameRoleCount === 2) return 60;
  return 30;
}

export function calculateInvestmentScore(
  synergyCount: number,
  compatibleTeams: number,
) {
  if (synergyCount >= 2 && compatibleTeams >= 2) return 100;
  if (synergyCount >= 1 && compatibleTeams >= 1) return 70;
  if (compatibleTeams >= 1) return 40;
  return 10;
}

export function calculateAccountValueScore(input: {
  alreadyOwned: boolean;
  synergyCount: number;
  compatibleTeams: number;
  deltaPercent: number;
}) {
  if (input.alreadyOwned) {
    return 30;
  }

  if (
    input.synergyCount >= 2 &&
    (input.compatibleTeams >= 2 || input.deltaPercent > 0)
  ) {
    return 85;
  }

  if (input.compatibleTeams >= 2) {
    return 80;
  }

  if (input.synergyCount >= 1) {
    return 60;
  }

  return 30;
}

export function calculateRecommendationFactorScores(
  input: RecommendationScoreInput,
): RecommendationFactorScores {
  return {
    damageScore: calculateDamageScore(input.deltaPercent),
    synergyScore: calculateSynergyFactorScore(
      input.synergyScore,
      input.synergyCount,
    ),
    teamScore: calculateTeamScore(
      input.compatibleTeams,
      input.singleStrongLinkSupportOpportunity ?? false,
    ),
    roleScore: calculateRoleScore(input.sameRoleCount, input.targetRole),
    investmentScore: calculateInvestmentScore(
      input.synergyCount,
      input.compatibleTeams,
    ),
    accountValueScore: calculateAccountValueScore({
      alreadyOwned: input.alreadyOwned,
      synergyCount: input.synergyCount,
      compatibleTeams: input.compatibleTeams,
      deltaPercent: input.deltaPercent,
    }),
  };
}

export function calculateRecommendationScoreBreakdown(
  factorScores: RecommendationFactorScores,
): RecommendationScoreBreakdown {
  return {
    damageContribution: weighted(
      factorScores.damageScore,
      RECOMMENDATION_WEIGHTS.damageScore,
    ),
    synergyContribution: weighted(
      factorScores.synergyScore,
      RECOMMENDATION_WEIGHTS.synergyScore,
    ),
    teamContribution: weighted(
      factorScores.teamScore,
      RECOMMENDATION_WEIGHTS.teamScore,
    ),
    roleContribution: weighted(
      factorScores.roleScore,
      RECOMMENDATION_WEIGHTS.roleScore,
    ),
    investmentContribution: weighted(
      factorScores.investmentScore,
      RECOMMENDATION_WEIGHTS.investmentScore,
    ),
    accountValueContribution: weighted(
      factorScores.accountValueScore,
      RECOMMENDATION_WEIGHTS.accountValueScore,
    ),
  };
}

export function calculateFinalRecommendationScore(
  breakdown: RecommendationScoreBreakdown,
) {
  return clamp(
    Math.round(
      breakdown.damageContribution +
        breakdown.synergyContribution +
        breakdown.teamContribution +
        breakdown.roleContribution +
        breakdown.investmentContribution +
        breakdown.accountValueContribution,
    ),
    0,
    100,
  );
}
