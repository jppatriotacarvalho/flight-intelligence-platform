import { useEffect, useMemo, useState } from "react";
import { getAirports } from "../services/api";
import type { AirportPerformance } from "../types";
import AirportCell from "../components/AirportCell";
import BarList from "../components/BarList";
import ChartCard from "../components/ChartCard";
import DataTable from "../components/DataTable";
import FilterBar from "../components/FilterBar";
import PageState from "../components/PageState";
import { CHART_COLORS, TOP_N } from "../lib/chart";
import { mins, num, pct, topBy } from "../lib/format";
import { airportDelayItems, airportVolumeItems } from "./chartData";

/** A tabela mostra os mais movimentados; a busca e' o caminho para os demais. */
const TABLE_ROWS = 20;

export default function Airports() {
  const [airports, setAirports] = useState<AirportPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    getAirports()
      .then(setAirports)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Filtro em memoria: os 348 registros ja' vieram na primeira requisicao,
  // entao nao ha' motivo para ir ao servidor de novo. Aceita a sigla
  // ("ATL", por prefixo) ou o nome/cidade ("Atlanta", em qualquer posicao) —
  // quem nao decorou o codigo IATA chega no mesmo registro.
  const filtrados = useMemo(() => {
    const termo = query.trim().toUpperCase();
    const base = termo
      ? airports.filter(
          (airport) =>
            airport.airport.startsWith(termo) ||
            (airport.airport_name ?? "").toUpperCase().includes(termo),
        )
      : airports;
    return topBy(base, (r) => r.total_flights, base.length);
  }, [airports, query]);

  const visiveis = filtrados.slice(0, TABLE_ROWS);
  const filtrando = query.trim().length > 0;

  return (
    <div className="page">
      <FilterBar
        label="Buscar aeroporto"
        fields={[
          {
            placeholder: "Sigla ou cidade (ex: ATL ou Atlanta)",
            value: query,
            maxLength: 30,
            onChange: (value) => setQuery(value),
          },
        ]}
        onClear={() => setQuery("")}
        count={`${num(filtrados.length)} de ${num(airports.length)} registros`}
      />

      {(loading || error) && <PageState loading={loading} error={error} skeletons={2} />}

      {!loading && !error && (
        <div className="card-grid">
          <ChartCard
            title="Volume de voos por aeroporto"
            hint={`top ${TOP_N} · pergunta 6`}
            source="gold.airport_performance"
            metric="total_flights no ano"
            unit="voos"
          >
            <BarList
              items={airportVolumeItems(airports, TOP_N)}
              color={CHART_COLORS.navy}
              format={(value) => num(value)}
              seriesName="Total de voos"
            />
          </ChartCard>

          <ChartCard
            title="Atraso médio de partida"
            hint={`top ${TOP_N} · pergunta 5`}
            source="gold.airport_performance"
            metric="average_departure_delay entre os aeroportos mais movimentados"
            unit="minutos"
          >
            <BarList
              items={airportDelayItems(airports, TOP_N)}
              color={CHART_COLORS.delay}
              format={(value) => mins(value)}
              seriesName="Atraso médio de partida"
            />
          </ChartCard>
        </div>
      )}

      <DataTable
        title="Detalhe por aeroporto"
        hint={
          filtrando
            ? `${num(visiveis.length)} de ${num(filtrados.length)} resultados para "${query.trim()}"`
            : `top ${TABLE_ROWS} por volume de um total de ${num(airports.length)}`
        }
        source="gold.airport_performance"
        metric="average_departure_delay e delay_rate por aeroporto"
        unit="minutos e %"
        loading={loading}
        error={error}
        data={visiveis}
        emptyMessage="Nenhum aeroporto encontrado para essa busca."
        columns={[
          {
            header: "Aeroporto",
            render: (r) => <AirportCell code={r.airport} name={r.airport_name} />,
          },
          { header: "Total de voos", align: "right", render: (r) => num(r.total_flights) },
          { header: "Taxa de atraso", align: "right", render: (r) => pct(r.delay_rate) },
          {
            header: "Atraso médio (partida)",
            align: "right",
            render: (r) => mins(r.average_departure_delay),
          },
          {
            header: "Cancelamento",
            align: "right",
            render: (r) => pct(r.cancellation_rate),
          },
        ]}
      />
    </div>
  );
}
