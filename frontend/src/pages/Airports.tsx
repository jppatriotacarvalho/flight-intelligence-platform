import { useEffect, useState } from "react";
import { getAirports } from "../services/api";
import type { AirportPerformance } from "../types";
import DataTable from "../components/DataTable";

export default function Airports() {
  const [data, setData] = useState<AirportPerformance[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAirports()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>Aeroportos</h2>
      <DataTable
        loading={loading}
        error={error}
        data={data}
        columns={[
          { header: "Aeroporto", render: (r) => r.airport },
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
            header: "Atraso Médio (Partida)",
            render: (r) =>
              r.average_departure_delay !== null
                ? `${r.average_departure_delay.toFixed(1)} min`
                : "—",
          },
          {
            header: "Taxa de Cancelamento",
            render: (r) =>
              r.cancellation_rate !== null
                ? `${(r.cancellation_rate * 100).toFixed(2)}%`
                : "—",
          },
        ]}
      />
    </div>
  );
}
