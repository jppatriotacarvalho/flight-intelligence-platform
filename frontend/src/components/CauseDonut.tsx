import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { TOOLTIP_LABEL_STYLE, TOOLTIP_STYLE } from "../lib/chart";
import { num } from "../lib/format";
import "./CauseDonut.css";

export interface CauseSlice {
  name: string;
  /** Minutos de atraso atribuidos ao motivo. */
  value: number;
  color: string;
}

interface CauseDonutProps {
  slices: CauseSlice[];
  /** 148px no dashboard, 186px na pagina de Atrasos. */
  size?: number;
  /** A legenda detalhada da pagina de Atrasos mostra tambem os minutos. */
  showMinutes?: boolean;
}

/**
 * Donut dos motivos de atraso com o maior motivo destacado no centro.
 * O rotulo central e' calculado a partir dos dados — nao e' fixo.
 */
export default function CauseDonut({
  slices,
  size = 148,
  showMinutes = false,
}: CauseDonutProps) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  if (total === 0) {
    return <p className="chart-empty">Sem dados para exibir.</p>;
  }

  const share = (value: number) =>
    `${((value / total) * 100).toFixed(1).replace(".", ",")}%`;

  const biggest = slices.reduce((top, slice) => (slice.value > top.value ? slice : top));

  return (
    <div className="donut">
      <div className="donut__chart" style={{ width: size, height: size, flex: `0 0 ${size}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="100%"
              paddingAngle={0}
              stroke="none"
              isAnimationActive={false}
            >
              {slices.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              formatter={(value: any, name: any) => [
                `${num(Number(value))} min (${share(Number(value))})`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut__center">
          <span className="donut__center-value" style={{ fontSize: size > 160 ? 22 : 17 }}>
            {share(biggest.value)}
          </span>
          <span className="donut__center-label">{biggest.name}</span>
        </div>
      </div>

      <ul className={`donut__legend${showMinutes ? " donut__legend--detailed" : ""}`}>
        {slices.map((slice) => (
          <li key={slice.name}>
            <span className="donut__swatch" style={{ backgroundColor: slice.color }} />
            <span className="donut__name">{slice.name}</span>
            {showMinutes && <span className="donut__minutes">{num(slice.value)}</span>}
            <span className="donut__share">{share(slice.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
