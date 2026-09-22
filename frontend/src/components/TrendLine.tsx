import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
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

/** Folga acima e abaixo da serie, para pico e vale nao encostarem na borda. */
const FOLGA = 0.02;

/** Arredonda para baixo/cima no multiplo de 5 pontos percentuais mais proximo. */
function passo(valor: number, sentido: "baixo" | "cima"): number {
  const escala = 0.05;
  const n = valor / escala;
  return (sentido === "baixo" ? Math.floor(n) : Math.ceil(n)) * escala;
}

/**
 * Curva mensal da taxa de atraso.
 *
 * Linha sem preenchimento: a area partia de 10% (o piso do eixo), nao de
 * zero, e o volume pintado exagerava a variacao real da serie.
 *
 * O dominio e' calculado a partir dos dados, com folga, em vez de fixo em
 * [0.1, 0.3] — um mes fora dessa faixa sairia cortado do grafico.
 */
export default function TrendLine({ points, height = 180 }: TrendLineProps) {
  if (points.length === 0) {
    return <p className="chart-empty">Sem dados para exibir.</p>;
  }

  const taxas = points.map((point) => point.rate);
  const minimo = Math.max(0, passo(Math.min(...taxas) - FOLGA, "baixo"));
  const maximo = passo(Math.max(...taxas) + FOLGA, "cima");

  // Pico e vale sao calculados, nunca fixos: se o dado mudar, o marcador
  // acompanha.
  const pico = points.reduce((top, point) => (point.rate > top.rate ? point : top));
  const vale = points.reduce((low, point) => (point.rate < low.rate ? point : low));

  const ticks: number[] = [];
  for (let valor = minimo; valor <= maximo + 1e-9; valor += 0.05) {
    ticks.push(Number(valor.toFixed(4)));
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={points} margin={{ top: 18, right: 14, bottom: 0, left: 0 }}>
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
          domain={[minimo, maximo]}
          ticks={ticks}
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
        <Line
          type="monotone"
          dataKey="rate"
          stroke={CHART_COLORS.accent}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, fill: CHART_COLORS.accent, stroke: "#fff", strokeWidth: 2 }}
          isAnimationActive={false}
        />

        <ReferenceDot
          x={pico.month}
          y={pico.rate}
          r={4}
          fill={CHART_COLORS.delay}
          stroke="#fff"
          strokeWidth={2}
          label={{
            value: `pico ${pct(pico.rate)}`,
            position: "top",
            fill: CHART_COLORS.delay,
            fontSize: 10.5,
          }}
        />
        <ReferenceDot
          x={vale.month}
          y={vale.rate}
          r={4}
          fill={CHART_COLORS.positive}
          stroke="#fff"
          strokeWidth={2}
          label={{
            value: `vale ${pct(vale.rate)}`,
            position: "bottom",
            fill: CHART_COLORS.positive,
            fontSize: 10.5,
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
