'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TeamDamageMember } from '../../lib/api';
import {
  CHART_AXIS_TICK,
  CHART_COLORS,
  CHART_GRID_PROPS,
  CHART_LEGEND_PROPS,
  CHART_TOOLTIP_PROPS,
  ChartFrame,
} from './chart-kit';

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

type ContributionTooltipProps = {
  active?: boolean;
  payload?: { payload?: ContributionPoint }[];
};

const MAX_TEAM_SIZE = 4;
const MAX_AXIS_NAME_LENGTH = 12;

function toShortName(name: string) {
  return name.length <= MAX_AXIS_NAME_LENGTH
    ? name
    : `${name.slice(0, MAX_AXIS_NAME_LENGTH)}...`;
}

function buildContributionData(
  currentMembers: TeamDamageMember[],
  proposedMembers: TeamDamageMember[],
): ContributionPoint[] {
  const currentById = new Map(currentMembers.map((member) => [member.id, member]));

  // El eje sigue el orden del equipo propuesto para que coincida con el equipo final.
  return proposedMembers.slice(0, MAX_TEAM_SIZE).map((member) => ({
    id: member.id,
    name: member.name,
    shortName: toShortName(member.name),
    role: member.role,
    profile: member.profile,
    currentDamage: currentById.get(member.id)?.damage ?? 0,
    proposedDamage: member.damage,
  }));
}

function ContributionTooltip({ active, payload }: ContributionTooltipProps) {
  const point = active ? payload?.[0]?.payload : undefined;
  if (!point) return null;

  const delta = point.proposedDamage - point.currentDamage;

  return (
    <div className="border border-[var(--line-strong)] bg-panel p-3 text-xs text-[var(--ink-800)]">
      <p className="font-semibold text-ink">{point.name}</p>
      <p className="mt-1">
        Rol: <span className="font-medium">{point.role}</span> · Perfil:{' '}
        <span className="font-medium">{point.profile}</span>
      </p>
      <p className="mt-1">
        Actual: <span className="font-medium">{point.currentDamage.toFixed(2)}</span>
      </p>
      <p>
        Propuesto:{' '}
        <span className="font-medium">{point.proposedDamage.toFixed(2)}</span>
      </p>
      <p>
        Delta miembro:{' '}
        <span className={`font-medium ${delta >= 0 ? 'text-success' : 'text-danger'}`}>
          {delta >= 0 ? '+' : ''}
          {delta.toFixed(2)}
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
    <ChartFrame heightClassName="h-80">
      <BarChart data={data} margin={{ top: 12, right: 12, left: 8, bottom: 20 }}>
        <CartesianGrid {...CHART_GRID_PROPS} />
        <XAxis
          dataKey="shortName"
          interval={0}
          tick={CHART_AXIS_TICK}
          tickMargin={10}
        />
        <YAxis tick={CHART_AXIS_TICK} />
        <Tooltip
          cursor={CHART_TOOLTIP_PROPS.cursor}
          content={<ContributionTooltip />}
        />
        <Legend {...CHART_LEGEND_PROPS} />
        <Bar
          dataKey="currentDamage"
          name="Equipo actual"
          fill={CHART_COLORS.current}
        />
        <Bar
          dataKey="proposedDamage"
          name="Equipo propuesto"
          fill={CHART_COLORS.proposed}
        />
      </BarChart>
    </ChartFrame>
  );
}
