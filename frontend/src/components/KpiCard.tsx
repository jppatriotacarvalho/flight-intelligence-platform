import "./KpiCard.css";

interface KpiCardProps {
  label: string;
  value: string;
  /** Linha de apoio abaixo do valor — ex.: o nome do aeroporto sob a sigla. */
  sub?: string | null;
  /** Cor da borda esquerda — classifica o indicador (atraso, cancelamento...). */
  accent: string;
}

export default function KpiCard({ label, value, sub, accent }: KpiCardProps) {
  return (
    <div className="kpi-card" style={{ borderLeftColor: accent }}>
      <span className="kpi-card__label">{label}</span>
      <span className="kpi-card__value">{value}</span>
      {sub && <span className="kpi-card__sub">{sub}</span>}
    </div>
  );
}
