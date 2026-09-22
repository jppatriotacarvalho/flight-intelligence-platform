import { useEffect, useMemo, useState } from "react";
import { getAirports } from "../services/api";
import type { AirportPerformance } from "../types";
import BarList from "../components/BarList";
import ChartCard from "../components/ChartCard";
import CodeCell from "../components/CodeCell";
import DataTable from "../components/DataTable";
import FilterBar from "../components/FilterBar";
import PageState from "../components/PageState";
import { CHART_COLORS, MIN_FLIGHTS_AIRPORT_TABLE, TOP_N } from "../lib/chart";
import { mins, num, pct } from "../lib/format";
import { airportDelayItems, airportVolumeItems } from "./chartData";

/** Quantas linhas aparecem de cada vez; o botao "Mostrar mais" revela o resto. */
const TABLE_ROWS = 20;

export default function Airports() {
  const [airports, setAirports] = useState<AirportPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  // Ligado por padrao (Decisao 05): ordenar por taxa sem piso leva EWN, com
  // 51 voos e 7,84% de cancelamento, para o topo da tabela.
  const [soRelevantes, setSoRelevantes] = useState(true);

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
  //
  // A lista sai daqui INTEIRA: quem corta e' a DataTable, depois de ordenar.
  const filtrados = useMemo(() => {
    const termo = query.trim().toUpperCase();
    return airports.filter((airport) => {
      if (soRelevantes && airport.total_flights < MIN_FLIGHTS_AIRPORT_TABLE) {
        return false;
      }
      if (!termo) return true;
      return (
        airport.airport.startsWith(termo) ||
        (airport.airport_name ?? "").toUpperCase().includes(termo)
      );
    });
  }, [airports, query, soRelevantes]);

  const filtrando = query.trim().length > 0;

  // O dump pode vir sem os nomes (colunas da Decisao 03 vazias). Prometer
  // "ou Atlanta" num banco so' com siglas manda o usuario buscar o que nao
  // existe, entao o placeholder segue o dado que chegou.
  const temNomes = airports.some((airport) => airport.airport_name);

  return (
    <div className="page">
      <FilterBar
        label="Buscar aeroporto"
        fields={[
          {
            placeholder: temNomes
              ? "Sigla ou cidade (ex: ATL ou Atlanta)"
              : "Sigla (ex: ATL)",
            value: query,
            maxLength: 30,
            wide: true,
            onChange: (value) => setQuery(value),
          },
        ]}
        toggles={[
          {
            label: `Só com ≥ ${num(MIN_FLIGHTS_AIRPORT_TABLE)} voos`,
            checked: soRelevantes,
            onChange: setSoRelevantes,
          },
        ]}
        onClear={() => {
          setQuery("");
          setSoRelevantes(true);
        }}
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
            ? `${num(filtrados.length)} resultados para "${query.trim()}" · clique no cabeçalho para ordenar`
            : `${num(filtrados.length)} de ${num(airports.length)} aeroportos · clique no cabeçalho para ordenar`
        }
        source="gold.airport_performance"
        metric="average_departure_delay e delay_rate por aeroporto"
        unit="minutos e %"
        loading={loading}
        error={error}
        data={filtrados}
        rowLimit={TABLE_ROWS}
        defaultSort={{ header: "Total de voos", direction: "desc" }}
        emptyMessage="Nenhum aeroporto encontrado para essa busca."
        columns={[
          {
            header: "Aeroporto",
            render: (r) => <CodeCell code={r.airport} name={r.airport_name} />,
            sortValue: (r) => r.airport,
          },
          {
            header: "Total de voos",
            align: "right",
            render: (r) => num(r.total_flights),
            sortValue: (r) => r.total_flights,
          },
          {
            header: "Taxa de atraso",
            align: "right",
            render: (r) => pct(r.delay_rate),
            sortValue: (r) => r.delay_rate,
          },
          {
            header: "Atraso médio (partida)",
            align: "right",
            render: (r) => mins(r.average_departure_delay),
            sortValue: (r) => r.average_departure_delay,
          },
          {
            header: "Cancelamento",
            align: "right",
            render: (r) => pct(r.cancellation_rate),
            sortValue: (r) => r.cancellation_rate,
          },
        ]}
      />
    </div>
  );
}
