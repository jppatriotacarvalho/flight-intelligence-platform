import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  TOOLTIP_LABEL_STYLE,
  TOOLTIP_STYLE,
  TRACK_COLOR,
  CHART_COLORS,
} from "../lib/chart";

export interface BarItem {
  label: string;
  value: number;
  /** Rotulo do tooltip quando o eixo mostra um nome curto ("YX · Republic Airways"). */
  tooltip?: string;
}

interface BarListProps {
  /** Ja' ordenado e cortado no Top N pela pagina. */
  items: BarItem[];
  /** Cor da serie; valores negativos usam sempre o verde de "adiantado". */
  color: string;
  /** Formatador do valor (num, pct, mins...). */
  format: (value: number) => string;
  /** Nome da serie no tooltip. */
  seriesName: string;
  /** Largura da coluna de rotulos: 52px para codigos IATA, 78px para rotas. */
  labelWidth?: number;
  /** Largura minima da coluna de valores; ela cresce sozinha se precisar. */
  minValueWidth?: number;
}

const ROW_HEIGHT = 26;

/**
 * Barra horizontal por categoria, no padrao do handoff:
 * rotulo mono a' esquerda · trilha cinza com a barra · valor alinhado a' direita.
 *
 * A coluna de valores e' um segundo eixo de categoria (orientation="right")
 * cujos ticks sao os valores formatados — assim eles ficam alinhados em coluna
 * em vez de flutuarem na ponta de cada barra.
 */
export default function BarList({
  items,
  color,
  format,
  seriesName,
  labelWidth = 52,
  minValueWidth = 82,
}: BarListProps) {
  if (items.length === 0) {
    return <p className="chart-empty">Sem dados para exibir.</p>;
  }

  const byLabel = new Map(items.map((item) => [item.label, item.value]));
  const byTooltip = new Map(items.map((item) => [item.label, item.tooltip]));
  const hasNegative = items.some((item) => item.value < 0);

  // A coluna de valores se dimensiona pelo texto mais longo da serie. Com
  // largura fixa, "41.974.007" era cortado no canto direito do SVG.
  const maiorTexto = items.reduce(
    (max, item) => Math.max(max, format(item.value).length),
    0,
  );
  const valueWidth = Math.max(minValueWidth, Math.ceil(maiorTexto * 7.3) + 16);

  const renderLabelTick = ({ x, y, payload }: any) => (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fontFamily="JetBrains Mono, monospace"
      fontSize={12}
      fontWeight={500}
      fill={CHART_COLORS.navy}
    >
      {payload.value}
    </text>
  );

  const renderValueTick = ({ x, y, payload }: any) => (
    <text
      x={x + valueWidth - 12}
      y={y}
      dy={4}
      textAnchor="end"
      fontSize={12.5}
      fill="#1a1a1a"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {format(byLabel.get(payload.value) ?? 0)}
    </text>
  );

  return (
    <ResponsiveContainer width="100%" height={items.length * ROW_HEIGHT + 10}>
      <BarChart
        data={items}
        layout="vertical"
        margin={{ top: 4, right: 0, bottom: 4, left: 0 }}
        barCategoryGap="28%"
      >
        <XAxis
          type="number"
          hide
          domain={hasNegative ? ["dataMin", "dataMax"] : [0, "dataMax"]}
        />
        <YAxis
          yAxisId="label"
          type="category"
          dataKey="label"
          width={labelWidth}
          axisLine={false}
          tickLine={false}
          tick={renderLabelTick}
        />
        <YAxis
          yAxisId="value"
          orientation="right"
          type="category"
          dataKey="label"
          width={valueWidth}
          axisLine={false}
          tickLine={false}
          tick={renderValueTick}
        />
        <Tooltip
          cursor={{ fill: "rgba(79,143,247,.06)" }}
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          labelFormatter={(label: any) => byTooltip.get(String(label)) ?? label}
          formatter={(value: any) => [format(Number(value)), seriesName]}
        />
        <Bar
          yAxisId="label"
          dataKey="value"
          barSize={9}
          radius={4.5}
          background={{ fill: TRACK_COLOR, radius: 4.5 }}
          isAnimationActive={false}
        >
          {items.map((item) => (
            <Cell
              key={item.label}
              fill={item.value < 0 ? CHART_COLORS.positive : color}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
