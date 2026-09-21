import { useEffect, useState } from "react";
import { getAirlines } from "../services/api";
import type { AirlinePerformance } from "../types";
import BarList from "../components/BarList";
import ChartCard from "../components/ChartCard";
import DataTable from "../components/DataTable";
import PageState from "../components/PageState";
import { CHART_COLORS } from "../lib/chart";
import { mins, num, pct, topBy } from "../lib/format";

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
  const porVolume = topBy(airlines, (r) => r.total_flights, total);

  return (
    <div className="page">
      {(loading || error) && <PageState loading={loading} error={error} skeletons={3} />}

      {!loading && !error && (
        <div className="card-grid">
          <ChartCard
            title="Taxa de atraso por companhia"
            hint={`${total} companhias`}
            source="gold.airline_performance"
            metric="% de voos com atraso de chegada > 15 min"
            unit="%"
          >
            <BarList
              items={topBy(airlines, (r) => r.delay_rate, total).map((r) => ({
                label: r.op_unique_carrier,
                value: r.delay_rate ?? 0,
              }))}
              color={CHART_COLORS.accent}
              format={(value) => pct(value)}
              seriesName="Taxa de atraso"
            />
          </ChartCard>

          <ChartCard
            title="Taxa de cancelamento por companhia"
            hint={`${total} companhias`}
            source="gold.airline_performance"
            metric="cancelled_flights / total_flights"
            unit="%"
          >
            <BarList
              items={topBy(airlines, (r) => r.cancellation_rate, total).map((r) => ({
                label: r.op_unique_carrier,
                value: r.cancellation_rate ?? 0,
              }))}
              color={CHART_COLORS.cancel}
              format={(value) => pct(value)}
              seriesName="Taxa de cancelamento"
            />
          </ChartCard>

          <ChartCard
            title="Volume de voos por companhia"
            hint={`${total} companhias`}
            source="gold.airline_performance"
            metric="total_flights no ano"
            unit="voos"
          >
            <BarList
              items={porVolume.map((r) => ({
                label: r.op_unique_carrier,
                value: r.total_flights,
              }))}
              color={CHART_COLORS.navy}
              format={(value) => num(value)}
              seriesName="Total de voos"
            />
          </ChartCard>
        </div>
      )}

      <DataTable
        title="Detalhe por companhia"
        hint={`${total} companhias · ordenadas por volume`}
        source="gold.airline_performance"
        metric="delay_rate = delayed_flights / total_flights"
        unit="% e minutos"
        loading={loading}
        error={error}
        data={porVolume}
        columns={[
          { header: "Companhia", render: (r) => r.op_unique_carrier, mono: true },
          { header: "Total de voos", align: "right", render: (r) => num(r.total_flights) },
          { header: "Taxa de atraso", align: "right", render: (r) => pct(r.delay_rate) },
          {
            header: "Atraso médio (chegada)",
            align: "right",
            render: (r) => mins(r.average_arrival_delay),
          },
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
