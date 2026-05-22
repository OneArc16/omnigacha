'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type ScoreBreakdown = {
  damageContribution: number;
  synergyContribution: number;
  teamContribution: number;
  roleContribution: number;
  investmentContribution: number;
  accountValueContribution: number;
};

type ScoreBreakdownChartProps = {
  breakdown: ScoreBreakdown;
};

type HelpBarShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  value?: number;
  payload?: {
    factor?: string;
  };
};

const SCORE_HELP: Record<string, string> = {
  Daño: 'Daño: aporte ponderado del factor de mejora o caída estimada de daño.',
  Sinergia:
    'Sinergia: aporte ponderado de compatibilidades detectadas con tu roster.',
  Equipos:
    'Equipos: aporte ponderado de la cantidad de equipos compatibles que el objetivo habilita.',
  Rol: 'Rol: aporte ponderado según qué tan necesario es ese rol en tu cuenta.',
  Inversión:
    'Inversión: aporte ponderado según cuántas piezas clave ya tienes para que funcione.',
  Cuenta:
    'Cuenta: aporte ponderado del valor general que agrega el personaje a tu cuenta.',
};

function ScoreHelpBarShape({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  fill = '#0ea5e9',
  value = 0,
  payload,
}: HelpBarShapeProps) {
  const helpText =
    SCORE_HELP[payload?.factor ?? ''] ?? 'Factor de impacto dentro del puntaje.';

  const iconX = x + width - 10;
  const iconY = value >= 0 ? y - 10 : y + height + 10;

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

export function ScoreBreakdownChart({ breakdown }: ScoreBreakdownChartProps) {
  const data = [
    { factor: 'Daño', value: breakdown.damageContribution },
    { factor: 'Sinergia', value: breakdown.synergyContribution },
    { factor: 'Equipos', value: breakdown.teamContribution },
    { factor: 'Rol', value: breakdown.roleContribution },
    { factor: 'Inversión', value: breakdown.investmentContribution },
    { factor: 'Cuenta', value: breakdown.accountValueContribution },
  ];

  return (
    <div className="h-72 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 24, right: 12, left: 8, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis dataKey="factor" tick={{ fill: 'var(--chart-axis)', fontSize: 12 }} />
          <YAxis tick={{ fill: 'var(--chart-axis)', fontSize: 12 }} />
          <Tooltip />
          <Bar
            dataKey="value"
            name="Impacto en puntaje"
            fill="#0ea5e9"
            radius={[8, 8, 0, 0]}
            shape={<ScoreHelpBarShape />}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
