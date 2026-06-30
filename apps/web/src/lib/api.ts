const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string;
  body?: unknown | FormData;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  let response: Response;
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body
        ? isFormData
          ? (options.body as FormData)
          : JSON.stringify(options.body)
        : undefined,
      cache: "no-store",
    });
  } catch (error) {
    throw new Error(
      `No fue posible conectar con la API en ${API_BASE_URL}. Verifica que la API esté encendida y que el origen del frontend esté permitido por CORS.`,
      {
        cause: error,
      },
    );
  }

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

export function buildApiAssetUrl(path?: string | null) {
  return path ? `${API_BASE_URL}${path}` : null;
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
    role: "USER" | "ADMIN";
    isActive: boolean;
    mustChangePassword: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

export type MeResponse = AuthResponse["user"];

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
      statKeys: CharacterStatKey[];
      stats: CharacterStatsMap;
      source: "manual" | "roster" | "catalog_base";
    };
    topSynergies: string[];
    damageComparison: DamageComparison;
    factorScores: {
      damageScore: number;
      synergyScore: number;
      teamScore: number;
      roleScore: number;
      investmentScore: number;
      accountValueScore: number;
    };
    scoringBreakdown: {
      damageContribution: number;
      synergyContribution: number;
      teamContribution: number;
      roleContribution: number;
      investmentContribution: number;
      accountValueContribution: number;
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
  statKeys: CharacterStatKey[];
  teamContext?: {
    mode: "auto" | "custom";
    members: Array<{
      id: number;
      name: string;
      isTarget: boolean;
    }>;
  };
  baseStats: CharacterStatsMap;
  simulatedStats: CharacterStatsMap;
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

export type CharacterStatKey =
  | "hp"
  | "atk"
  | "def"
  | "speed"
  | "crit_rate"
  | "crit_damage"
  | "break_effect"
  | "energy_regen_rate"
  | "effect_hit_rate"
  | "effect_res"
  | "elemental_dmg_bonus";

export type CharacterStatsMap = Partial<Record<CharacterStatKey, number>>;

export type CharacterTag = {
  key: string;
  displayLabel: string;
  category:
    | "PRO"
    | "CON"
    | "ARCHETYPE"
    | "ROLE"
    | "CHARACTERISTIC"
    | "SPECIAL";
};

export type CharacterTagBuckets = {
  pros: string[];
  cons: string[];
  archetypes: string[];
  roles: string[];
  characteristics: string[];
  special: string[];
  all: string[];
};

export type CharacterStatProfile = {
  prioritizedStatKeys: CharacterStatKey[];
  enabledStatKeys: CharacterStatKey[];
};

export type CharacterAlias = {
  alias: string;
  normalizedAlias: string;
  locale?: string | null;
  source?: string | null;
};

export type CharacterTraceStat = {
  id: number;
  statKey:
    | "HP_PERCENT"
    | "ATK_PERCENT"
    | "DEF_PERCENT"
    | "SPEED_FLAT"
    | "CRIT_RATE"
    | "CRIT_DAMAGE"
    | "BREAK_EFFECT"
    | "ENERGY_REGEN_RATE"
    | "EFFECT_HIT_RATE"
    | "EFFECT_RES"
    | "ELEMENTAL_DMG_BONUS";
  value: number;
};

export type SimulationHistoryItem = {
  id: number;
  userId: number;
  label: string;
  payload: {
    type?: "recommendation" | "damage_scenario";
    targetCharacterId?: number;
    targetStats?: {
      statKeys?: CharacterStatKey[];
      stats?: CharacterStatsMap;
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
    statKeys?: CharacterStatKey[];
    teamContext?: {
      mode?: "auto" | "custom";
      members?: Array<{
        id?: number;
        name?: string;
        isTarget?: boolean;
      }>;
    };
    adjustments?: {
      atkDelta?: number;
      critRateDelta?: number;
      critDamageDelta?: number;
      speedDelta?: number;
    };
    baseStats?: CharacterStatsMap;
    simulatedStats?: CharacterStatsMap;
    baseTeamDamage?: number;
    simulatedTeamDamage?: number;
    factorScores?: {
      damageScore?: number;
      synergyScore?: number;
      teamScore?: number;
      roleScore?: number;
      investmentScore?: number;
      accountValueScore?: number;
    };
    scoringBreakdown?: {
      damageContribution?: number;
      synergyContribution?: number;
      teamContribution?: number;
      roleContribution?: number;
      investmentContribution?: number;
      accountValueContribution?: number;
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
  slug: string;
  element: string;
  path: string;
  role: string;
  rarity: number;
  gameVersion: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseCritRate: number;
  baseCritDamage: number;
  baseSpeed: number;
  splashArtAssetId?: number | null;
  splashArtUrl?: string | null;
  aliases: CharacterAlias[];
  tags: CharacterTag[];
  tagBuckets: CharacterTagBuckets;
  traceStats: CharacterTraceStat[];
  statProfile: CharacterStatProfile;
  defaultStats: CharacterStatsMap;
};

export type LightCone = {
  id: number;
  name: string;
  slug: string;
  path: string;
  rarity: number;
  effectDescription?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  splashArtAssetId?: number | null;
  splashArtUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type RelicSet = {
  id: number;
  name: string;
  slug: string;
  type: "ARTIFACT" | "ORNAMENT";
  rarity: number;
  twoPieceBonus: string;
  fourPieceBonus?: string | null;
  gameVersion?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  splashArtAssetId?: number | null;
  splashArtUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminDashboardSummaryResponse = {
  totalUsers: number;
  totalActiveAdmins: number;
  totalCharacters: number;
  draftCharacters: number;
  totalLightCones: number;
  draftLightCones: number;
  totalRelicSets: number;
  draftRelicSets: number;
  totalMediaAssets: number;
};

export type AdminUserRecord = {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminMediaAsset = {
  id: number;
  kind: "SPLASH_ART";
  storageDriver: "LOCAL" | "S3";
  storageKey: string;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  checksum?: string | null;
  createdByUserId: number;
  createdAt: string;
  updatedAt: string;
};

export type UserCharacter = {
  id: number;
  userId: number;
  level: number;
  eidolon: number;
  lightConeId?: number | null;
  lightConeName?: string;
  lightConeLevel?: number;
  hp?: number | null;
  atk: number;
  def?: number | null;
  critRate: number;
  critDamage: number;
  breakEffect?: number | null;
  energyRegenRate?: number | null;
  effectHitRate?: number | null;
  effectRes?: number | null;
  elementalDmgBonus?: number | null;
  speed: number;
  stats: CharacterStatsMap;
  statSources: Partial<
    Record<CharacterStatKey, "catalog_default" | "user_input" | "legacy_migrated">
  >;
  lightCone?: {
    id: number;
    name: string;
    path: string;
    rarity: number;
  } | null;
  character: Character;
};
