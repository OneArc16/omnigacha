'use client';

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import type { RecommendationResponse } from '../../lib/api';
import {
  CHART_AXIS_TICK,
  CHART_COLORS,
  CHART_GRID_PROPS,
  CHART_TOOLTIP_PROPS,
  ChartFrame,
  HelpBar,
} from './chart-kit';

type ScoreBreakdown = RecommendationResponse['context']['scoringBreakdown'];

type ScoreBreakdownChartProps = {
  breakdown: ScoreBreakdown;
};

const SCORE_FACTORS: { factor: string; key: keyof ScoreBreakdown; help: string }[] = [
  {
    factor: 'Daño',
    key: 'damageContribution',
    help: 'Daño: aporte ponderado del factor de mejora o caída estimada de daño.',
  },
  {
    factor: 'Sinergia',
    key: 'synergyContribution',
    help: 'Sinergia: aporte ponderado de compatibilidades detectadas con tu roster.',
  },
  {
    factor: 'Equipos',
    key: 'teamContribution',
    help: 'Equipos: aporte ponderado de la cantidad de equipos compatibles que el objetivo habilita.',
  },
  {
    factor: 'Rol',
    key: 'roleContribution',
    help: 'Rol: aporte ponderado según qué tan necesario es ese rol en tu cuenta.',
  },
  {
    factor: 'Inversión',
    key: 'investmentContribution',
    help: 'Inversión: aporte ponderado según cuántas piezas clave ya tienes para que funcione.',
  },
  {
    factor: 'Cuenta',
    key: 'accountValueContribution',
    help: 'Cuenta: aporte ponderado del valor general que agrega el personaje a tu cuenta.',
  },
];

const HELP_BY_FACTOR = Object.fromEntries(
  SCORE_FACTORS.map(({ factor, help }) => [factor, help]),
);

export function ScoreBreakdownChart({ breakdown }: ScoreBreakdownChartProps) {
  const data = SCORE_FACTORS.map(({ factor, key }) => ({
    factor,
    value: breakdown[key],
  }));

  return (
    <ChartFrame>
      <BarChart data={data} margin={{ top: 24, right: 12, left: 8, bottom: 12 }}>
        <CartesianGrid {...CHART_GRID_PROPS} />
        <XAxis dataKey="factor" tick={CHART_AXIS_TICK} />
        <YAxis tick={CHART_AXIS_TICK} />
        <Tooltip {...CHART_TOOLTIP_PROPS} />
        <Bar
          dataKey="value"
          name="Impacto en puntaje"
          fill={CHART_COLORS.proposed}
          shape={
            <HelpBar
              resolveHelp={(payload) =>
                HELP_BY_FACTOR[String(payload.factor ?? '')] ??
                'Factor de impacto dentro del puntaje.'
              }
            />
          }
        />
      </BarChart>
    </ChartFrame>
  );
}
