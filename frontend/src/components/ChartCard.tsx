import type { ReactNode } from "react";
import "./ChartCard.css";

interface ChartCardProps {
  title: string;
  source: string;
  metric: string;
  unit: string;
  children: ReactNode;
}

export default function ChartCard({ title, source, metric, unit, children }: ChartCardProps) {
  return (
    <div className="chart-card">
      <h3 className="chart-card__title">{title}</h3>
      <div className="chart-card__body">{children}</div>
      <p className="chart-card__caption">
        <strong>Fonte:</strong> {source} · <strong>Métrica:</strong> {metric} ·{" "}
        <strong>Unidade:</strong> {unit}
      </p>
    </div>
  );
}
