import { useEffect, useState } from "react";
import { getAirlines } from "../services/api";
import type { AirlinePerformance } from "../types";
import DataTable from "../components/DataTable";

export default function Airlines() {
  const [data, setData] = useState<AirlinePerformance[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAirlines()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>Companhias Aéreas</h2>
      <DataTable
        loading={loading}
        error={error}
        data={data}
        columns={[
          { header: "Companhia", render: (r) => r.op_unique_carrier },
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
