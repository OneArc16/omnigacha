'use client';

import { ReactNode } from 'react';
import { ResponsiveContainer } from 'recharts';

/** Colores de serie: lo existente en púrpura, lo propuesto en dorado. */
export const CHART_COLORS = {
  current: 'var(--purple-deep)',
  proposed: 'var(--gold)',
};

export const CHART_GRID_PROPS = {
  strokeDasharray: '3 3',
  stroke: 'var(--chart-grid)',
};

export const CHART_AXIS_TICK = { fill: 'var(--chart-axis)', fontSize: 12 };

export const CHART_TOOLTIP_PROPS = {
  cursor: { fill: 'rgba(160,180,255,.06)' },
  contentStyle: {
    background: 'var(--panel)',
    border: '1px solid var(--line-strong)',
    borderRadius: 0,
    fontSize: 12,
  },
  labelStyle: { color: 'var(--text)', fontWeight: 600 },
  itemStyle: { color: 'var(--ink-800)' },
};

export const CHART_LEGEND_PROPS = {
  wrapperStyle: { fontSize: 12, color: 'var(--muted)' },
};

type ChartFrameProps = {
  children: ReactNode;
  heightClassName?: string;
};

export function ChartFrame({ children, heightClassName = 'h-72' }: ChartFrameProps) {
  return (
    <div className={`${heightClassName} w-full border border-line-soft surface-inset p-3`}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

type HelpBarProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  value?: number;
  payload?: Record<string, unknown>;
  /** Texto de ayuda de la barra a partir del punto de datos. */
  resolveHelp: (payload: Record<string, unknown>) => string;
};

/** Barra con un "?" que explica la categoría al pasar el cursor. */
export function HelpBar({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  fill = CHART_COLORS.proposed,
  value = 0,
  payload = {},
  resolveHelp,
}: HelpBarProps) {
  const iconX = x + width - 10;
  const iconY = value >= 0 ? y - 10 : y + height + 10;

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} />
      <g transform={`translate(${iconX}, ${iconY})`}>
        <title>{resolveHelp(payload)}</title>
        <circle r={8} fill="var(--bg)" stroke="var(--line-strong)" />
        <text
          x={0}
          y={0}
          fill="var(--gold)"
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
