import { useEffect, useState } from "react";
import { getDelayCauses, getTrends } from "../services/api";
import type { DelayCauses, FlightTrend } from "../types";
import CauseDonut from "../components/CauseDonut";
import ChartCard from "../components/ChartCard";
import DataTable from "../components/DataTable";
import PageState from "../components/PageState";
import TrendLine from "../components/TrendLine";
import { mins, monthLong, monthShort, num, pct } from "../lib/format";
import { causeSlices } from "./chartData";

export default function Delays() {
  const [causes, setCauses] = useState<DelayCauses | null>(null);
  const [trends, setTrends] = useState<FlightTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getDelayCauses(), getTrends()])
      .then(([causeData, trendData]) => {
        setCauses(causeData);
        setTrends(trendData);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const slices = causeSlices(causes);
  const totalMinutos = slices.reduce((sum, slice) => sum + slice.value, 0);

  const trendPoints = trends.map((trend) => ({
    month: monthShort(trend.month),
    rate: trend.delay_rate ?? 0,
  }));

  const pico = trends
    .filter((trend) => trend.delay_rate !== null)
    .reduce<FlightTrend | null>(
      (top, trend) => ((trend.delay_rate ?? 0) > (top?.delay_rate ?? -1) ? trend : top),
      null,
    );
  // O pico e o vale ja' aparecem marcados na propria curva; o hint so' liga
  // o grafico as perguntas de negocio.
  const trendHint = pico
    ? `perguntas 11 e 13 · pico em ${monthLong(pico.month).toLowerCase()}`
    : "perguntas 11 e 13";

  return (
    <div className="page">
      {(loading || error) && <PageState loading={loading} error={error} skeletons={3} />}

      {!loading && !error && (
        <>
          <ChartCard
            title="Evolução mensal da taxa de atraso"
            hint={trendHint}
            source="gold.flight_trends"
            metric="% de voos com atraso de chegada > 15 min, por mês"
            unit="%"
          >
            <TrendLine points={trendPoints} height={230} />
          </ChartCard>

          <ChartCard
            title="Composição dos motivos de atraso"
            hint={`perguntas 14 a 16 · ${num(totalMinutos)} minutos no ano`}
            source="gold.delay_causes"
            metric="soma de minutos de atraso atribuídos a cada motivo"
            unit="minutos"
          >
            <CauseDonut slices={slices} size={186} showMinutes />
          </ChartCard>
        </>
      )}

      <DataTable
        title="Evolução mensal"
        hint={`${trends.length} meses de 2024`}
        source="gold.flight_trends"
        metric="delay_rate e average_arrival_delay por mês"
        unit="% e minutos"
        loading={loading}
        error={error}
        data={trends}
        defaultSort={{ header: "Mês", direction: "asc" }}
        columns={[
          {
            header: "Mês",
            render: (r) => monthLong(r.month),
            mono: true,
            // Ordena pelo numero do mes, nao pelo nome: "Abril" vem antes de
            // "Janeiro" em ordem alfabetica.
            sortValue: (r) => r.month,
          },
          {
            header: "Total de voos",
            align: "right",
            render: (r) => num(r.total_flights),
            sortValue: (r) => r.total_flights,
          },
          {
            header: "Voos atrasados",
            align: "right",
            render: (r) => num(r.delayed_flights),
            sortValue: (r) => r.delayed_flights,
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
        ]}
      />
    </div>
  );
}
