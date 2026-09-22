import { useEffect, useState } from "react";
import { getAirlines } from "../services/api";
import type { AirlinePerformance } from "../types";
import AirlineScatter from "../components/AirlineScatter";
import BarList from "../components/BarList";
import ChartCard from "../components/ChartCard";
import CodeCell from "../components/CodeCell";
import DataTable from "../components/DataTable";
import PageState from "../components/PageState";
import { CHART_COLORS } from "../lib/chart";
import { mins, num, pct } from "../lib/format";
import { airlineItems, airlineWeightedAverage } from "./chartData";

/** "Southwest" e' o nome curto mais longo; 52px (o padrao, para siglas) corta. */
const AIRLINE_LABEL_WIDTH = 78;

export default function Airlines() {
  const [airlines, setAirlines] = useState<AirlinePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAirlines()
      .then(setAirlines)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Todas as 15 companhias aparecem nos graficos: o conjunto e' pequeno o
  // bastante para a comparacao visual ser direta, sem Top N.
  const total = airlines.length;

  // Media do setor ponderada por volume (19,82% e 1,36%), nao a media das 15
  // taxas — e' o mesmo numero que o KPI do dashboard mostra.
  const mediaAtraso = airlineWeightedAverage(airlines, (r) => r.delay_rate);
  const mediaCancelamento = airlineWeightedAverage(airlines, (r) => r.cancellation_rate);

  return (
    <div className="page">
      {(loading || error) && <PageState loading={loading} error={error} skeletons={3} />}

      {!loading && !error && (
        <div className="card-grid">
          <ChartCard
            title="Taxa de atraso por companhia"
            hint={`${total} companhias · pergunta 4`}
            source="gold.airline_performance"
            metric="% de voos com atraso de chegada > 15 min"
            unit="%"
          >
            <BarList
              items={airlineItems(airlines, (r) => r.delay_rate)}
              color={CHART_COLORS.accent}
              format={(value) => pct(value)}
              seriesName="Taxa de atraso"
              labelWidth={AIRLINE_LABEL_WIDTH}
              reference={
                mediaAtraso !== null
                  ? { value: mediaAtraso, label: `setor ${pct(mediaAtraso)}` }
                  : undefined
              }
            />
          </ChartCard>

          <ChartCard
            title="Atraso médio de chegada por companhia"
            hint={`${total} companhias · pergunta 1`}
            source="gold.airline_performance"
            metric="average_arrival_delay (negativo = chegada adiantada)"
            unit="minutos"
          >
            <BarList
              items={airlineItems(airlines, (r) => r.average_arrival_delay)}
              color={CHART_COLORS.delay}
              format={(value) => mins(value)}
              seriesName="Atraso médio de chegada"
              labelWidth={AIRLINE_LABEL_WIDTH}
            />
          </ChartCard>

          <ChartCard
            title="Taxa de cancelamento por companhia"
            hint={`${total} companhias · pergunta 2`}
            source="gold.airline_performance"
            metric="cancelled_flights / total_flights"
            unit="%"
          >
            <BarList
              items={airlineItems(airlines, (r) => r.cancellation_rate)}
              color={CHART_COLORS.cancel}
              format={(value) => pct(value)}
              seriesName="Taxa de cancelamento"
              labelWidth={AIRLINE_LABEL_WIDTH}
              reference={
                mediaCancelamento !== null
                  ? { value: mediaCancelamento, label: `setor ${pct(mediaCancelamento)}` }
                  : undefined
              }
            />
          </ChartCard>

          <ChartCard
            title="Volume de voos por companhia"
            hint={`${total} companhias · pergunta 3`}
            source="gold.airline_performance"
            metric="total_flights no ano"
            unit="voos"
          >
            <BarList
              items={airlineItems(airlines, (r) => r.total_flights)}
              color={CHART_COLORS.navy}
              format={(value) => num(value)}
              seriesName="Total de voos"
              labelWidth={AIRLINE_LABEL_WIDTH}
            />
          </ChartCard>

          <ChartCard
            title="Atraso × cancelamento"
            hint={`${total} companhias · tamanho da bolha = volume`}
            source="gold.airline_performance"
            metric="delay_rate × cancellation_rate, linhas nas médias ponderadas do setor"
            unit="% e voos"
            span="1 / -1"
          >
            <AirlineScatter
              airlines={airlines}
              delayAverage={mediaAtraso}
              cancelAverage={mediaCancelamento}
            />
          </ChartCard>
        </div>
      )}

      <DataTable
        title="Detalhe por companhia"
        hint={`${total} companhias · clique no cabeçalho para ordenar`}
        source="gold.airline_performance"
        metric="delay_rate = delayed_flights / total_flights"
        unit="% e minutos"
        loading={loading}
        error={error}
        data={airlines}
        defaultSort={{ header: "Total de voos", direction: "desc" }}
        columns={[
          {
            header: "Companhia",
            render: (r) => (
              <CodeCell code={r.op_unique_carrier} name={r.airline_name} />
            ),
            sortValue: (r) => r.airline_name ?? r.op_unique_carrier,
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
            header: "Atraso médio (chegada)",
            align: "right",
            render: (r) => mins(r.average_arrival_delay),
            sortValue: (r) => r.average_arrival_delay,
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
