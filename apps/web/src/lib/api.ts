const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string;
  body?: unknown;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    const message =
      typeof payload === "string"
        ? payload
        : payload?.message || payload?.error || "Request failed";

    throw new Error(
      Array.isArray(message) ? message.join(", ") : String(message),
    );
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
  tokenType: "Bearer";
  user: {
    id: number;
    name: string;
    email: string;
    createdAt: string;
  };
};

export type DashboardSummaryResponse = {
  totalCharacters: number;
  totalRecommendations: number;
  totalSimulations: number;
  lastRecommendation: {
    characterName: string;
    recommendation:
      | "NO_RECOMENDADO"
      | "SITUACIONAL"
      | "RECOMENDADO"
      | "MUY_RECOMENDADO";
    score: number;
  } | null;
};

export type RecommendationResponse = {
  recommendation: RecommendationRecord;
  context: {
    targetCharacter: Character;
    ownedCount: number;
    appliedTargetStats?: {
      atk: number;
      critRate: number;
      critDamage: number;
      speed: number;
      source: "manual" | "roster" | "catalog_base";
    };
    topSynergies: string[];
    damageComparison: DamageComparison;
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

export type TeamDamageMember = {
  id: number;
  name: string;
  role: "dps" | "sub_dps" | "support" | "sustain" | "unknown";
  profile: "single_target" | "aoe" | "dot" | "burst" | "utility";
  damage: number;
  synergyMultiplier: number;
  profileMultiplier: number;
};

export type TeamDamageSnapshot = {
  totalDamage: number;
  roleCoverageBonus: number;
  profileCoverageBonus: number;
  members: TeamDamageMember[];
};

export type DamageComparison = {
  currentTeam: TeamDamageSnapshot;
  proposedTeam: TeamDamageSnapshot;
  deltaAbsolute: number;
  deltaPercent: number;
};

export type DamageScenarioResponse = {
  character: {
    id: number;
    name: string;
  };
  type: "damage_scenario";
  teamContext?: {
    mode: "auto" | "custom";
    members: Array<{
      id: number;
      name: string;
      isTarget: boolean;
    }>;
  };
  adjustments: {
    atkDelta: number;
    critRateDelta: number;
    critDamageDelta: number;
    speedDelta: number;
  };
  baseStats: {
    atk: number;
    critRate: number;
    critDamage: number;
    speed: number;
  };
  simulatedStats: {
    atk: number;
    critRate: number;
    critDamage: number;
    speed: number;
  };
  baseTeamDamage: number;
  simulatedTeamDamage: number;
  deltaAbsolute: number;
  deltaPercent: number;
  damageComparison: DamageComparison;
  summary: string;
};

export type RecommendationRecord = {
  id: number;
  userId: number;
  targetCharacter: string;
  score: number;
  level: "NO_RECOMENDADO" | "SITUACIONAL" | "RECOMENDADO" | "MUY_RECOMENDADO";
  explanation: string;
  estimatedDeltaDmg: number;
  compatibleTeams: number;
  createdAt: string;
};

export type RecommendationDetailResponse = RecommendationRecord;

export type SimulationHistoryItem = {
  id: number;
  userId: number;
  label: string;
  payload: {
    type?: "recommendation" | "damage_scenario";
    targetCharacterId?: number;
    targetStats?: {
      atk?: number;
      critRate?: number;
      critDamage?: number;
      speed?: number;
      source?: "manual" | "roster" | "catalog_base";
    };
    synergyCount?: number;
    synergyScore?: number;
    sameRoleCount?: number;
    alreadyOwned?: boolean;
    currentTeamDamage?: number;
    proposedTeamDamage?: number;
    deltaPercent?: number;
    deltaAbsolute?: number;
    characterId?: number;
    characterName?: string;
    adjustments?: {
      atkDelta?: number;
      critRateDelta?: number;
      critDamageDelta?: number;
      speedDelta?: number;
    };
    teamContext?: {
      mode?: "auto" | "custom";
      members?: Array<{
        id?: number;
        name?: string;
        isTarget?: boolean;
      }>;
    };
    baseStats?: {
      atk?: number;
      critRate?: number;
      critDamage?: number;
      speed?: number;
    };
    simulatedStats?: {
      atk?: number;
      critRate?: number;
      critDamage?: number;
      speed?: number;
    };
    baseTeamDamage?: number;
    simulatedTeamDamage?: number;
    scoringBreakdown?: {
      baseScore?: number;
      synergyImpact?: number;
      damageImpact?: number;
      roleNeedBonus?: number;
      profileCompositionImpact?: number;
      ownershipPenalty?: number;
    };
    score?: number;
    level?:
      | "NO_RECOMENDADO"
      | "SITUACIONAL"
      | "RECOMENDADO"
      | "MUY_RECOMENDADO";
  };
  createdAt: string;
};

export type SimulationDetailResponse = SimulationHistoryItem;

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

export type LightCone = {
  id: number;
  name: string;
  path: string;
  rarity: number;
  effectDescription?: string | null;
};

export type UserCharacter = {
  id: number;
  level: number;
  eidolon: number;
  lightConeId?: number | null;
  lightConeName?: string;
  lightConeLevel?: number;
  atk: number;
  critRate: number;
  critDamage: number;
  speed: number;
  lightCone?: {
    id: number;
    name: string;
    path: string;
    rarity: number;
  } | null;
  character: {
    id: number;
    name: string;
    element: string;
    path: string;
    role: string;
  };
};
