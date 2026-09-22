import { useEffect, useState } from "react";
import {
  getAirlines,
  getAirports,
  getDashboard,
  getDelayCauses,
  getRoutes,
  getTrends,
} from "../services/api";
import type {
  AirlinePerformance,
  AirportPerformance,
  DashboardSummary,
  DelayCauses,
  FlightTrend,
  RoutePerformance,
} from "../types";
import BarList from "../components/BarList";
import CauseDonut from "../components/CauseDonut";
import ChartCard from "../components/ChartCard";
import KpiCard from "../components/KpiCard";
import PageState from "../components/PageState";
import SectionHeader from "../components/SectionHeader";
import TrendLine from "../components/TrendLine";
import {
  CHART_COLORS,
  POOL_AEROPORTOS_MOVIMENTADOS,
  TOP_N_DASHBOARD,
} from "../lib/chart";
import { miles, mins, monthLong, monthShort, num, pct } from "../lib/format";
import {
  airlineItems,
  airlineWeightedAverage,
  airportCancelItems,
  airportDelayItems,
  airportVolumeItems,
  causeSlices,
  routeDelayItems,
  routePairItems,
} from "./chartData";

/** "Southwest" e' o nome curto mais longo; 52px (o padrao, para siglas) corta. */
const AIRLINE_LABEL_WIDTH = 78;

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [airlines, setAirlines] = useState<AirlinePerformance[]>([]);
  const [airports, setAirports] = useState<AirportPerformance[]>([]);
  const [routes, setRoutes] = useState<RoutePerformance[]>([]);
  const [causes, setCauses] = useState<DelayCauses | null>(null);
  const [trends, setTrends] = useState<FlightTrend[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getDashboard(),
      getAirlines(),
      getAirports(),
      getRoutes(),
      getDelayCauses(),
      getTrends(),
    ])
      .then(([summaryData, airlineData, airportData, routeData, causeData, trendData]) => {
        setSummary(summaryData);
        setAirlines(airlineData);
        setAirports(airportData);
        setRoutes(routeData);
        setCauses(causeData);
        setTrends(trendData);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading || error || !summary) {
    return (
      <div className="page">
        <PageState loading={loading} error={error} skeletons={6} kpi />
        {!error && <PageState loading={loading} error={null} skeletons={4} />}
      </div>
    );
  }

  const kpis = [
    {
      label: "Total de voos",
      value: num(summary.total_flights),
      sub: "soma das 15 companhias",
      accent: CHART_COLORS.accent,
    },
    {
      label: "Taxa de atraso",
      value: pct(summary.delay_rate),
      sub: "voos atrasados ÷ total de voos",
      accent: CHART_COLORS.delay,
    },
    {
      label: "Atraso médio (chegada)",
      value: mins(summary.average_arrival_delay),
      sub: "ponderado por voos concluídos",
      accent: CHART_COLORS.delay,
    },
    {
      label: "Taxa de cancelamento",
      value: pct(summary.cancellation_rate),
      sub: "cancelados ÷ total de voos",
      accent: CHART_COLORS.cancel,
    },
    {
      label: "Companhia mais pontual",
      value: summary.most_punctual_airline ?? "—",
      sub: [
        summary.most_punctual_airline_name,
        pct(summary.most_punctual_airline_delay_rate),
      ]
        .filter(Boolean)
        .join(" · "),
      accent: CHART_COLORS.positive,
    },
    {
      // O criterio entra na linha de apoio: sem piso de volume o topo seria
      // MGW, com 37 voos no ano — numero real, leitura errada.
      label: "Aeroporto mais atrasado",
      value: summary.most_delayed_airport ?? "—",
      sub: `${mins(summary.most_delayed_airport_delay)} · entre os ${POOL_AEROPORTOS_MOVIMENTADOS} mais movimentados`,
      accent: CHART_COLORS.cancel,
    },
  ];

  const trendPoints = trends.map((trend) => ({
    month: monthShort(trend.month),
    rate: trend.delay_rate ?? 0,
  }));

  const peak = trends.reduce<FlightTrend | null>(
    (top, trend) => ((trend.delay_rate ?? 0) > (top?.delay_rate ?? -1) ? trend : top),
    null,
  );

  // Media do setor ponderada por volume — o mesmo numero do KPI de cima.
  const mediaAtraso = airlineWeightedAverage(airlines, (r) => r.delay_rate);
  const mediaCancelamento = airlineWeightedAverage(airlines, (r) => r.cancellation_rate);

  const slices = causeSlices(causes);
  const totalCauseMinutes = slices.reduce((sum, slice) => sum + slice.value, 0);
  const causeHint = `${(totalCauseMinutes / 1000000).toFixed(1).replace(".", ",")} mi de minutos`;

  return (
    <div className="page">
      <div className="kpi-grid">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            sub={kpi.sub}
            accent={kpi.accent}
          />
        ))}
      </div>

      <section className="section">
        <SectionHeader title="Companhias aéreas" hint="perguntas 1 a 4" />
        {/* 2x2 com as 15 companhias em todos os cards: com Top N diferente
            por card, a mais pontual sumia justamente do grafico de atraso e
            os cards ficavam com alturas diferentes. */}
        <div className="card-grid card-grid--pairs">
          <ChartCard
            title="Taxa de atraso por companhia"
            hint="pergunta 4"
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
            hint="pergunta 1"
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
            hint="pergunta 2"
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
            hint="pergunta 3"
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
        </div>
      </section>

      <section className="section">
        <SectionHeader title="Aeroportos" hint="perguntas 5 a 7" />
        <div className="card-grid">
          <ChartCard
            title="Volume de voos por aeroporto"
            hint="pergunta 6"
            source="gold.airport_performance"
            metric="total_flights no ano"
            unit="voos"
          >
            <BarList
              items={airportVolumeItems(airports, TOP_N_DASHBOARD)}
              color={CHART_COLORS.navy}
              format={(value) => num(value)}
              seriesName="Total de voos"
            />
          </ChartCard>

          <ChartCard
            title="Atraso médio de partida"
            hint="pergunta 5"
            source="gold.airport_performance"
            metric="average_departure_delay entre os aeroportos mais movimentados"
            unit="minutos"
          >
            <BarList
              items={airportDelayItems(airports, TOP_N_DASHBOARD)}
              color={CHART_COLORS.delay}
              format={(value) => mins(value)}
              seriesName="Atraso médio de partida"
            />
          </ChartCard>

          <ChartCard
            title="Taxa de cancelamento por aeroporto"
            hint="pergunta 7"
            source="gold.airport_performance"
            metric={`cancellation_rate entre os ${POOL_AEROPORTOS_MOVIMENTADOS} mais movimentados`}
            unit="%"
          >
            <BarList
              items={airportCancelItems(airports, TOP_N_DASHBOARD)}
              color={CHART_COLORS.cancel}
              format={(value) => pct(value)}
              seriesName="Taxa de cancelamento"
            />
          </ChartCard>
        </div>
      </section>

      <section className="section">
        <SectionHeader title="Rotas" hint="perguntas 8 a 10" />
        <div className="card-grid">
          <ChartCard
            title="Top rotas por volume"
            hint="pergunta 8"
            source="gold.route_performance"
            metric="total_flights por par de cidades, soma dos dois sentidos"
            unit="voos"
          >
            <BarList
              items={routePairItems(routes, TOP_N_DASHBOARD, "flights")}
              color={CHART_COLORS.navy}
              format={(value) => num(value)}
              seriesName="Total de voos"
              labelWidth={78}
            />
          </ChartCard>

          <ChartCard
            title="Top rotas por atraso médio"
            hint="pergunta 9"
            source="gold.route_performance"
            metric="average_arrival_delay (rotas com mais de 2.000 voos)"
            unit="minutos"
          >
            <BarList
              items={routeDelayItems(routes, TOP_N_DASHBOARD)}
              color={CHART_COLORS.delay}
              format={(value) => mins(value)}
              seriesName="Atraso médio de chegada"
              labelWidth={78}
            />
          </ChartCard>

          <ChartCard
            title="Rotas mais longas"
            hint="pergunta 10"
            source="gold.route_performance"
            metric="average_distance por par de cidades, soma dos dois sentidos"
            unit="milhas"
          >
            <BarList
              items={routePairItems(routes, TOP_N_DASHBOARD, "distance")}
              color={CHART_COLORS.accent}
              format={(value) => miles(value)}
              seriesName="Distância"
              labelWidth={78}
            />
          </ChartCard>
        </div>
      </section>

      <section className="section">
        <SectionHeader title="Tempo & motivos de atraso" hint="perguntas 11, 13 a 16" />
        <div className="card-grid">
          <ChartCard
            title="Taxa de atraso ao longo do ano"
            hint={
              peak
                ? `pico em ${monthLong(peak.month).toLowerCase()} · ${pct(peak.delay_rate)}`
                : undefined
            }
            source="gold.flight_trends"
            metric="% de voos com atraso de chegada > 15 min, por mês"
            unit="%"
          >
            <TrendLine points={trendPoints} />
          </ChartCard>

          <ChartCard
            title="Distribuição dos motivos de atraso"
            hint={causeHint}
            source="gold.delay_causes"
            metric="soma de minutos de atraso atribuídos a cada motivo"
            unit="minutos"
          >
            <CauseDonut slices={slices} />
          </ChartCard>
        </div>
      </section>
    </div>
  );
}
