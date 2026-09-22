import {
  CartesianGrid,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { AirlinePerformance } from "../types";
import {
  AXIS_COLOR,
  CHART_COLORS,
  GRID_COLOR,
  TOOLTIP_LABEL_STYLE,
  TOOLTIP_STYLE,
} from "../lib/chart";
import { num, pct } from "../lib/format";

interface AirlineScatterProps {
  airlines: AirlinePerformance[];
  /** Medias ponderadas do setor — viram as linhas que formam os quadrantes. */
  delayAverage: number | null;
  cancelAverage: number | null;
  height?: number;
}

interface Ponto {
  x: number;
  y: number;
  z: number;
  code: string;
  name: string;
  short: string;
}

/**
 * Atraso x cancelamento por companhia.
 *
 * Um ranking mostra uma metrica de cada vez; aqui as duas aparecem juntas e
 * o tamanho da bolha traz o volume, entao da' para ver que a companhia com a
 * pior taxa nao e' necessariamente a que afeta mais passageiros.
 *
 * As linhas tracejadas sao as medias PONDERADAS do setor: acima e a' direita
 * delas esta' quem e' pior que a media em ambas.
 */
export default function AirlineScatter({
  airlines,
  delayAverage,
  cancelAverage,
  height = 340,
}: AirlineScatterProps) {
  const pontos: Ponto[] = airlines
    .filter((a) => a.delay_rate !== null && a.cancellation_rate !== null)
    .map((a) => ({
      x: a.delay_rate ?? 0,
      y: a.cancellation_rate ?? 0,
      z: a.total_flights,
      code: a.op_unique_carrier,
      name: a.airline_name ?? a.op_unique_carrier,
      short: a.airline_short_name ?? a.op_unique_carrier,
    }));

  if (pontos.length === 0) {
    return <p className="chart-empty">Sem dados para exibir.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 16, right: 24, bottom: 16, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
        <XAxis
          type="number"
          dataKey="x"
          name="Taxa de atraso"
          domain={["dataMin - 0.02", "dataMax + 0.02"]}
          tickFormatter={(value: number) => pct(value, 0)}
          axisLine={false}
          tickLine={false}
          tick={{ fill: AXIS_COLOR, fontSize: 11 }}
          label={{
            value: "Taxa de atraso",
            position: "insideBottom",
            offset: -8,
            fill: AXIS_COLOR,
            fontSize: 11,
          }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="Taxa de cancelamento"
          domain={["dataMin - 0.003", "dataMax + 0.003"]}
          tickFormatter={(value: number) => pct(value, 1)}
          axisLine={false}
          tickLine={false}
          width={56}
          tick={{ fill: AXIS_COLOR, fontSize: 11 }}
          label={{
            value: "Cancelamento",
            angle: -90,
            position: "insideLeft",
            fill: AXIS_COLOR,
            fontSize: 11,
          }}
        />
        {/* O volume entra como area da bolha: a Southwest tem 18x os voos da
            Hawaiian, e o ponto precisa dizer isso. */}
        <ZAxis type="number" dataKey="z" range={[60, 620]} name="Total de voos" />

        {delayAverage !== null && (
          <ReferenceLine
            x={delayAverage}
            stroke={AXIS_COLOR}
            strokeDasharray="4 3"
            label={{
              value: `média ${pct(delayAverage)}`,
              position: "top",
              fill: AXIS_COLOR,
              fontSize: 10,
            }}
          />
        )}
        {cancelAverage !== null && (
          <ReferenceLine
            y={cancelAverage}
            stroke={AXIS_COLOR}
            strokeDasharray="4 3"
            label={{
              value: `média ${pct(cancelAverage)}`,
              position: "right",
              fill: AXIS_COLOR,
              fontSize: 10,
            }}
          />
        )}

        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          content={({ active, payload }: any) => {
            if (!active || !payload || payload.length === 0) return null;
            const ponto: Ponto = payload[0].payload;
            return (
              <div style={TOOLTIP_STYLE}>
                <div style={TOOLTIP_LABEL_STYLE}>
                  {ponto.code} · {ponto.name}
                </div>
                <div>Taxa de atraso: {pct(ponto.x)}</div>
                <div>Cancelamento: {pct(ponto.y)}</div>
                <div>Voos: {num(ponto.z)}</div>
              </div>
            );
          }}
        />

        <Scatter
          data={pontos}
          fill={CHART_COLORS.accent}
          fillOpacity={0.55}
          stroke={CHART_COLORS.accent}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="short"
            position="top"
            offset={9}
            style={{ fill: CHART_COLORS.navy, fontSize: 10.5 }}
          />
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
