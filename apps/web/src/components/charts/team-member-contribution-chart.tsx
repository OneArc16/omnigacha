'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type TeamDamageMember = {
  id: number;
  name: string;
  role: 'dps' | 'sub_dps' | 'support' | 'sustain' | 'unknown';
  profile: 'single_target' | 'aoe' | 'dot' | 'burst' | 'utility';
  damage: number;
  synergyMultiplier: number;
  profileMultiplier: number;
};

type TeamMemberContributionChartProps = {
  currentMembers: TeamDamageMember[];
  proposedMembers: TeamDamageMember[];
};

type ContributionPoint = {
  id: number;
  name: string;
  shortName: string;
  role: TeamDamageMember['role'];
  profile: TeamDamageMember['profile'];
  currentDamage: number;
  proposedDamage: number;
};

type TooltipPayloadItem = {
  payload?: ContributionPoint;
};

type ContributionTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
};

function toShortName(name: string) {
  if (name.length <= 12) return name;
  return `${name.slice(0, 12)}...`;
}

function buildContributionData(
  currentMembers: TeamDamageMember[],
  proposedMembers: TeamDamageMember[],
) {
  const currentById = new Map(currentMembers.map((member) => [member.id, member]));

  // Keep exactly the proposed team order (up to 4 members), so axis matches final team.
  return proposedMembers.slice(0, 4).map((member) => ({
    id: member.id,
    name: member.name,
    shortName: toShortName(member.name),
    role: member.role,
    profile: member.profile,
    currentDamage: currentById.get(member.id)?.damage ?? 0,
    proposedDamage: member.damage,
  }));
}

function formatDamage(value: number) {
  return value.toFixed(2);
}

function ContributionTooltip({ active, payload }: ContributionTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0]?.payload;
  if (!point) return null;

  const delta = point.proposedDamage - point.currentDamage;

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 text-xs text-[var(--ink-800)] shadow-sm">
      <p className="font-semibold text-[var(--ink-900)]">{point.name}</p>
      <p className="mt-1">
        Rol: <span className="font-medium">{point.role}</span> · Perfil:{' '}
        <span className="font-medium">{point.profile}</span>
      </p>
      <p className="mt-1">
        Actual: <span className="font-medium">{formatDamage(point.currentDamage)}</span>
      </p>
      <p>
        Propuesto: <span className="font-medium">{formatDamage(point.proposedDamage)}</span>
      </p>
      <p>
        Delta miembro:{' '}
        <span className={`font-medium ${delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {delta >= 0 ? '+' : ''}
          {formatDamage(delta)}
        </span>
      </p>
    </div>
  );
}

export function TeamMemberContributionChart({
  currentMembers,
  proposedMembers,
}: TeamMemberContributionChartProps) {
  const data = buildContributionData(currentMembers, proposedMembers);

  return (
    <div className="h-80 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 12, left: 8, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis
            dataKey="shortName"
            interval={0}
            tick={{ fill: 'var(--chart-axis)', fontSize: 12 }}
            tickMargin={10}
          />
          <YAxis tick={{ fill: 'var(--chart-axis)', fontSize: 12 }} />
          <Tooltip content={<ContributionTooltip />} />
          <Legend />
          <Bar
            dataKey="currentDamage"
            name="Equipo actual"
            fill="#0284c7"
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="proposedDamage"
            name="Equipo propuesto"
            fill="#0ea5e9"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
