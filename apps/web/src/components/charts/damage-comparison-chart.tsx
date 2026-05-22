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

type DamageComparisonChartProps = {
  currentTotal: number;
  proposedTotal: number;
  currentLabel?: string;
  proposedLabel?: string;
  seriesName?: string;
  helpTextByLabel?: Record<string, string>;
};

type HelpBarShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  helpTextByLabel?: Record<string, string>;
  payload?: {
    name?: string;
  };
};

const DAMAGE_HELP: Record<string, string> = {
  Actual:
    'Actual: daño estimado del mejor equipo que ya puedes armar con tu cuenta.',
  Propuesto:
    'Propuesto: daño estimado del equipo al incluir el personaje objetivo.',
};

function DamageHelpBarShape({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  fill = '#0284c7',
  helpTextByLabel = DAMAGE_HELP,
  payload,
}: HelpBarShapeProps) {
  const helpText =
    helpTextByLabel[payload?.name ?? ''] ??
    'Barra de comparación de daño estimado.';

  const iconX = x + width - 10;
  const iconY = y - 10;

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={8} ry={8} />
      <g transform={`translate(${iconX}, ${iconY})`}>
        <title>{helpText}</title>
        <circle r={8} fill="#0f172a" opacity={0.92} />
        <text
          x={0}
          y={0}
          fill="#f8fafc"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={10}
          fontWeight={700}
        >
          ?
        </text>
      </g>
    </g>
  );
}

export function DamageComparisonChart({
  currentTotal,
  proposedTotal,
  currentLabel = 'Actual',
  proposedLabel = 'Propuesto',
  seriesName = 'Daño estimado',
  helpTextByLabel = DAMAGE_HELP,
}: DamageComparisonChartProps) {
  const data = [
    {
      name: currentLabel,
      total: Number(currentTotal.toFixed(2)),
    },
    {
      name: proposedLabel,
      total: Number(proposedTotal.toFixed(2)),
    },
  ];

  return (
    <div className="h-72 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 24, right: 12, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis dataKey="name" tick={{ fill: 'var(--chart-axis)', fontSize: 12 }} />
          <YAxis tick={{ fill: 'var(--chart-axis)', fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="total"
            name={seriesName}
            fill="#0284c7"
            radius={[8, 8, 0, 0]}
            shape={<DamageHelpBarShape helpTextByLabel={helpTextByLabel} />}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
