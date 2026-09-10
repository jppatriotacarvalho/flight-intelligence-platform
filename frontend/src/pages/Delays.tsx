import { useEffect, useState } from "react";
import { getDelayCauses, getTrends } from "../services/api";
import type { DelayCauses, FlightTrend } from "../types";
import DataTable from "../components/DataTable";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function Delays() {
  const [causes, setCauses] = useState<DelayCauses | null>(null);
  const [causesError, setCausesError] = useState<string | null>(null);
  const [causesLoading, setCausesLoading] = useState(true);

  const [trends, setTrends] = useState<FlightTrend[] | null>(null);
  const [trendsError, setTrendsError] = useState<string | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(true);

  useEffect(() => {
    getDelayCauses()
      .then(setCauses)
      .catch((err) => setCausesError(err.message))
      .finally(() => setCausesLoading(false));

    getTrends()
      .then(setTrends)
      .catch((err) => setTrendsError(err.message))
      .finally(() => setTrendsLoading(false));
  }, []);

  const causesRows = causes
    ? [
        { label: "Companhia Aérea", value: causes.total_carrier_delay },
        { label: "Clima", value: causes.total_weather_delay },
        { label: "Sistema Aéreo Nacional (NAS)", value: causes.total_nas_delay },
        { label: "Segurança", value: causes.total_security_delay },
        { label: "Aeronave Anterior", value: causes.total_late_aircraft_delay },
      ]
    : null;

  return (
    <div>
      <h2>Motivos de Atraso (Total do Ano)</h2>
      <DataTable
        loading={causesLoading}
        error={causesError}
        data={causesRows}
        columns={[
          { header: "Motivo", render: (r) => r.label },
          {
            header: "Total de Minutos",
            render: (r) => (r.value !== null ? r.value.toLocaleString("pt-BR") : "—"),
          },
        ]}
      />

      <h2 style={{ marginTop: "2.5rem" }}>Evolução Mensal</h2>
      <DataTable
        loading={trendsLoading}
        error={trendsError}
        data={trends}
        columns={[
          { header: "Mês", render: (r) => MONTH_NAMES[r.month - 1] ?? r.month },
          {
            header: "Total de Voos",
            render: (r) => r.total_flights.toLocaleString("pt-BR"),
          },
          {
            header: "Taxa de Atraso",
            render: (r) =>
              r.delay_rate !== null ? `${(r.delay_rate * 100).toFixed(2)}%` : "—",
          },
          {
            header: "Atraso Médio (Chegada)",
            render: (r) =>
              r.average_arrival_delay !== null
                ? `${r.average_arrival_delay.toFixed(1)} min`
                : "—",
          },
        ]}
      />
    </div>
  );
}
