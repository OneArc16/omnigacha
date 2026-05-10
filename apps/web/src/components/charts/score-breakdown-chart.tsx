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
  baseScore: number;
  synergyImpact: number;
  damageImpact: number;
  roleNeedBonus: number;
  profileCompositionImpact: number;
  ownershipPenalty: number;
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
  Base: 'Base: puntaje inicial del modelo antes de aplicar factores.',
  Sinergia: 'Sinergia: impacto de compatibilidad con tu roster.',
  Dano: 'Dano: impacto del cambio de dano estimado entre equipos.',
  Rol: 'Rol: bonus si el rol del objetivo cubre una necesidad en la cuenta.',
  Perfil:
    'Perfil: bonus por mejor cobertura entre ST/AoE/DoT/Burst en la composicion.',
  Penalizacion:
    'Penalizacion: descuento aplicado cuando ya posees el personaje objetivo.',
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
    SCORE_HELP[payload?.factor ?? ''] ?? 'Factor de impacto dentro del score.';

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
    { factor: 'Base', value: breakdown.baseScore },
    { factor: 'Sinergia', value: breakdown.synergyImpact },
    { factor: 'Dano', value: breakdown.damageImpact },
    { factor: 'Rol', value: breakdown.roleNeedBonus },
    { factor: 'Perfil', value: breakdown.profileCompositionImpact },
    { factor: 'Penalizacion', value: -breakdown.ownershipPenalty },
  ];

  return (
    <div className="h-72 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 24, right: 12, left: 8, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ec" />
          <XAxis dataKey="factor" tick={{ fill: '#475569', fontSize: 12 }} />
          <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
          <Tooltip />
          <Bar
            dataKey="value"
            name="Impacto en score"
            fill="#0ea5e9"
            radius={[8, 8, 0, 0]}
            shape={<ScoreHelpBarShape />}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
