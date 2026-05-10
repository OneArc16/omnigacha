const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  token?: string;
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? '';
    const payload = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    const message =
      typeof payload === 'string'
        ? payload
        : payload?.message || payload?.error || 'Request failed';

    throw new Error(Array.isArray(message) ? message.join(', ') : String(message));
  }

  return response.json() as Promise<T>;
}

export type CursorPage<T> = {
  items: T[];
  nextCursor: number | null;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  user: {
    id: number;
    name: string;
    email: string;
    createdAt: string;
  };
};

export type RecommendationResponse = {
  recommendation: RecommendationRecord;
  context: {
    targetCharacter: Character;
    ownedCount: number;
    topSynergies: string[];
    damageComparison: {
      currentTeam: {
        totalDamage: number;
        roleCoverageBonus: number;
        profileCoverageBonus: number;
        members: Array<{
          id: number;
          name: string;
          role: 'dps' | 'sub_dps' | 'support' | 'sustain' | 'unknown';
          profile: 'single_target' | 'aoe' | 'dot' | 'burst' | 'utility';
          damage: number;
          synergyMultiplier: number;
          profileMultiplier: number;
        }>;
      };
      proposedTeam: {
        totalDamage: number;
        roleCoverageBonus: number;
        profileCoverageBonus: number;
        members: Array<{
          id: number;
          name: string;
          role: 'dps' | 'sub_dps' | 'support' | 'sustain' | 'unknown';
          profile: 'single_target' | 'aoe' | 'dot' | 'burst' | 'utility';
          damage: number;
          synergyMultiplier: number;
          profileMultiplier: number;
        }>;
      };
      deltaAbsolute: number;
      deltaPercent: number;
    };
    scoringBreakdown: {
      baseScore: number;
      synergyImpact: number;
      damageImpact: number;
      roleNeedBonus: number;
      profileCompositionImpact: number;
      ownershipPenalty: number;
    };
  };
};

export type RecommendationRecord = {
  id: number;
  userId: number;
  targetCharacter: string;
  score: number;
  level: 'NO_RECOMENDADO' | 'SITUACIONAL' | 'RECOMENDADO' | 'MUY_RECOMENDADO';
  explanation: string;
  estimatedDeltaDmg: number;
  compatibleTeams: number;
  createdAt: string;
};

export type SimulationHistoryItem = {
  id: number;
  userId: number;
  label: string;
  payload: {
    targetCharacterId?: number;
    synergyCount?: number;
    synergyScore?: number;
    sameRoleCount?: number;
    alreadyOwned?: boolean;
    currentTeamDamage?: number;
    proposedTeamDamage?: number;
    deltaPercent?: number;
    scoringBreakdown?: {
      baseScore?: number;
      synergyImpact?: number;
      damageImpact?: number;
      roleNeedBonus?: number;
      profileCompositionImpact?: number;
      ownershipPenalty?: number;
    };
    score?: number;
    level?: 'NO_RECOMENDADO' | 'SITUACIONAL' | 'RECOMENDADO' | 'MUY_RECOMENDADO';
  };
  createdAt: string;
};

export type Character = {
  id: number;
  name: string;
  element: string;
  path: string;
  role: string;
  baseAtk: number;
  baseCritRate: number;
  baseCritDamage: number;
  baseSpeed: number;
};

export type UserCharacter = {
  id: number;
  level: number;
  eidolon: number;
  lightConeName?: string;
  lightConeLevel?: number;
  atk: number;
  critRate: number;
  critDamage: number;
  speed: number;
  character: {
    id: number;
    name: string;
    element: string;
    path: string;
    role: string;
  };
};
