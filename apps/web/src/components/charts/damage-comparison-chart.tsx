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
import {
  CHART_AXIS_TICK,
  CHART_COLORS,
  CHART_GRID_PROPS,
  CHART_LEGEND_PROPS,
  CHART_TOOLTIP_PROPS,
  ChartFrame,
  HelpBar,
} from './chart-kit';

type DamageComparisonChartProps = {
  currentTotal: number;
  proposedTotal: number;
  currentLabel?: string;
  proposedLabel?: string;
  seriesName?: string;
  helpTextByLabel?: Record<string, string>;
};

const DAMAGE_HELP: Record<string, string> = {
  Actual:
    'Actual: daño estimado del mejor equipo que ya puedes armar con tu cuenta.',
  Propuesto:
    'Propuesto: daño estimado del equipo al incluir el personaje objetivo.',
};

export function DamageComparisonChart({
  currentTotal,
  proposedTotal,
  currentLabel = 'Actual',
  proposedLabel = 'Propuesto',
  seriesName = 'Daño estimado',
  helpTextByLabel = DAMAGE_HELP,
}: DamageComparisonChartProps) {
  const data = [
    { name: currentLabel, total: Number(currentTotal.toFixed(2)) },
    { name: proposedLabel, total: Number(proposedTotal.toFixed(2)) },
  ];

  return (
    <ChartFrame>
      <BarChart data={data} margin={{ top: 24, right: 12, left: 8, bottom: 8 }}>
        <CartesianGrid {...CHART_GRID_PROPS} />
        <XAxis dataKey="name" tick={CHART_AXIS_TICK} />
        <YAxis tick={CHART_AXIS_TICK} />
        <Tooltip {...CHART_TOOLTIP_PROPS} />
        <Legend {...CHART_LEGEND_PROPS} />
        <Bar
          dataKey="total"
          name={seriesName}
          fill={CHART_COLORS.proposed}
          shape={
            <HelpBar
              resolveHelp={(payload) =>
                helpTextByLabel[String(payload.name ?? '')] ??
                'Barra de comparación de daño estimado.'
              }
            />
          }
        />
      </BarChart>
    </ChartFrame>
  );
}
