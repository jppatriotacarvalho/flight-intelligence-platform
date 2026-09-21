import type { ReactNode } from "react";
import "./ChartCard.css";

interface ChartCardProps {
  title: string;
  /** Texto curto no canto direito do cabecalho (ex.: "pergunta 3"). */
  hint?: string;
  source: string;
  metric: string;
  unit: string;
  /** "1 / -1" faz o card ocupar a largura inteira do grid. */
  span?: string;
  children: ReactNode;
}

export default function ChartCard({
  title,
  hint,
  source,
  metric,
  unit,
  span,
  children,
}: ChartCardProps) {
  return (
    <div className="chart-card" style={span ? { gridColumn: span } : undefined}>
      <div className="chart-card__header">
        <h4 className="chart-card__title">{title}</h4>
        {hint && <span className="chart-card__hint">{hint}</span>}
      </div>
      <div className="chart-card__body">{children}</div>
      <p className="chart-card__caption">
        <strong>Fonte:</strong> <span className="chart-card__source">{source}</span> ·{" "}
        <strong>Métrica:</strong> {metric} · <strong>Unidade:</strong> {unit}
      </p>
    </div>
  );
}
