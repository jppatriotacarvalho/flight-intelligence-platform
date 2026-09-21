import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AXIS_COLOR,
  CHART_COLORS,
  GRID_COLOR,
  TOOLTIP_LABEL_STYLE,
  TOOLTIP_STYLE,
} from "../lib/chart";
import { pct } from "../lib/format";

export interface TrendPoint {
  /** Rotulo do eixo X (Jan, Fev, ...). */
  month: string;
  /** Fracao, como vem da coluna delay_rate (0.2793 = 27,93%). */
  rate: number;
}

interface TrendLineProps {
  points: TrendPoint[];
  height?: number;
}

/**
 * Curva mensal da taxa de atraso: area suave + linha accent.
 * O dominio fixo de 10% a 30% vem do handoff e mantem a curva legivel
 * (a serie real de 2024 vai de 12,51% a 27,93%).
 */
export default function TrendLine({ points, height = 180 }: TrendLineProps) {
  if (points.length === 0) {
    return <p className="chart-empty">Sem dados para exibir.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={points} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="month"
          stroke={GRID_COLOR}
          tickLine={false}
          tick={{
            fill: AXIS_COLOR,
            fontSize: 11,
            fontFamily: "JetBrains Mono, monospace",
          }}
        />
        <YAxis
          domain={[0.1, 0.3]}
          ticks={[0.1, 0.15, 0.2, 0.25, 0.3]}
          tickFormatter={(value: number) => pct(value, 0)}
          axisLine={false}
          tickLine={false}
          width={46}
          tick={{ fill: AXIS_COLOR, fontSize: 11 }}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          formatter={(value: any) => [pct(Number(value)), "Taxa de atraso"]}
        />
        <Area
          type="monotone"
          dataKey="rate"
          stroke={CHART_COLORS.accent}
          strokeWidth={2.5}
          fill={CHART_COLORS.accent}
          fillOpacity={0.14}
          dot={false}
          activeDot={{ r: 4, fill: CHART_COLORS.accent, stroke: "#fff", strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
