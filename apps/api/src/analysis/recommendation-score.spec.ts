import {
  calculateFinalRecommendationScore,
  calculateRecommendationFactorScores,
  calculateRecommendationScoreBreakdown,
} from './recommendation-score';

describe('recommendation-score', () => {
  it('keeps a strong DoT pickup in recommended range even when absolute damage delta is negative', () => {
    const factorScores = calculateRecommendationFactorScores({
      deltaPercent: -35.67,
      synergyScore: 83,
      synergyCount: 2,
      compatibleTeams: 4,
      sameRoleCount: 2,
      alreadyOwned: false,
      targetRole: 'dps',
    });
    const breakdown = calculateRecommendationScoreBreakdown(factorScores);
    const finalScore = calculateFinalRecommendationScore(breakdown);

    expect(factorScores).toEqual({
      damageScore: 0,
      synergyScore: 100,
      teamScore: 100,
      roleScore: 60,
      investmentScore: 100,
      accountValueScore: 85,
    });
    expect(finalScore).toBe(68);
  });

  it('keeps unsupported low-synergy targets in not recommended range', () => {
    const factorScores = calculateRecommendationFactorScores({
      deltaPercent: -12,
      synergyScore: 0,
      synergyCount: 0,
      compatibleTeams: 1,
      sameRoleCount: 3,
      alreadyOwned: false,
      targetRole: 'dps',
    });
    const breakdown = calculateRecommendationScoreBreakdown(factorScores);
    const finalScore = calculateFinalRecommendationScore(breakdown);

    expect(finalScore).toBeLessThan(40);
  });

  it('downranks already owned characters through account value', () => {
    const factorScores = calculateRecommendationFactorScores({
      deltaPercent: 18,
      synergyScore: 80,
      synergyCount: 2,
      compatibleTeams: 3,
      sameRoleCount: 1,
      alreadyOwned: true,
      targetRole: 'support',
    });

    expect(factorScores.accountValueScore).toBe(30);
  });

  it('keeps a single-strong-link hypercarry support in situational range', () => {
    const factorScores = calculateRecommendationFactorScores({
      deltaPercent: -26.56,
      synergyScore: 91,
      synergyCount: 1,
      compatibleTeams: 0,
      sameRoleCount: 2,
      alreadyOwned: false,
      targetRole: 'support',
      singleStrongLinkSupportOpportunity: true,
    });
    const breakdown = calculateRecommendationScoreBreakdown(factorScores);
    const finalScore = calculateFinalRecommendationScore(breakdown);

    expect(factorScores).toEqual({
      damageScore: 0,
      synergyScore: 100,
      teamScore: 45,
      roleScore: 75,
      investmentScore: 10,
      accountValueScore: 60,
    });
    expect(finalScore).toBe(47);
  });
});
