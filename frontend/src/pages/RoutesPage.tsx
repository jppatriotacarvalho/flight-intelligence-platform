import { useEffect, useState } from "react";
import { getRoutes } from "../services/api";
import type { RoutePerformance } from "../types";
import DataTable from "../components/DataTable";
import "./RoutesPage.css";

export default function RoutesPage() {
  const [data, setData] = useState<RoutePerformance[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  function loadRoutes(filters?: { origin?: string; destination?: string }) {
    setLoading(true);
    setError(null);
    getRoutes(filters)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadRoutes();
  }, []);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    loadRoutes({
      origin: origin.trim() || undefined,
      destination: destination.trim() || undefined,
    });
  }

  function handleClear() {
    setOrigin("");
    setDestination("");
    loadRoutes();
  }

  return (
    <div>
      <h2>Rotas</h2>

      <form className="routes-filter" onSubmit={handleFilter}>
        <input
          placeholder="Origem (ex: JFK)"
          value={origin}
          onChange={(e) => setOrigin(e.target.value.toUpperCase())}
          maxLength={5}
        />
        <input
          placeholder="Destino (ex: LAX)"
          value={destination}
          onChange={(e) => setDestination(e.target.value.toUpperCase())}
          maxLength={5}
        />
        <button type="submit">Filtrar</button>
        <button type="button" onClick={handleClear}>
          Limpar
        </button>
      </form>

      <DataTable
        loading={loading}
        error={error}
        data={data}
        emptyMessage="Nenhuma rota encontrada para esse filtro."
        columns={[
          { header: "Origem", render: (r) => r.origin },
          { header: "Destino", render: (r) => r.dest },
          {
            header: "Total de Voos",
            render: (r) => r.total_flights.toLocaleString("pt-BR"),
          },
          {
            header: "Atraso Médio (Chegada)",
            render: (r) =>
              r.average_arrival_delay !== null
                ? `${r.average_arrival_delay.toFixed(1)} min`
                : "—",
          },
          {
            header: "Distância Média",
            render: (r) =>
              r.average_distance !== null
                ? `${r.average_distance.toFixed(0)} mi`
                : "—",
          },
        ]}
      />
    </div>
  );
}
