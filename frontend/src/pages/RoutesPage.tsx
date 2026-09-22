import { useEffect, useMemo, useState } from "react";
import { getRoutes } from "../services/api";
import type { RoutePerformance } from "../types";
import CodeCell from "../components/CodeCell";
import BarList from "../components/BarList";
import ChartCard from "../components/ChartCard";
import DataTable from "../components/DataTable";
import FilterBar from "../components/FilterBar";
import PageState from "../components/PageState";
import { CHART_COLORS, MIN_FLIGHTS_ROUTE_TABLE, TOP_N } from "../lib/chart";
import { miles, mins, num } from "../lib/format";
import { routeDelayItems, routeVolumeItems } from "./chartData";

/** O filtro vai ao servidor; esperar o usuario parar de digitar evita
 *  disparar uma requisicao por tecla. */
const DEBOUNCE_MS = 350;

/** Sao 6.805 rotas: renderizar todas travaria a pagina. A ordenacao acontece
 *  sobre o conjunto inteiro; o botao "Mostrar mais" revela o resto. */
const TABLE_ROWS = 100;

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RoutePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [origin, setOrigin] = useState("");
  const [dest, setDest] = useState("");

  /** Total sem filtro, guardado na primeira carga para o contador. */
  const [totalRoutes, setTotalRoutes] = useState<number | null>(null);

  // Ligado por padrao (Decisao 05): sem piso, ordenar por atraso medio traz
  // rotas de dezenas de voos no ano para o topo.
  const [soRelevantes, setSoRelevantes] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      getRoutes({
        origin: origin.trim() || undefined,
        destination: dest.trim() || undefined,
      })
        .then((data) => {
          setRoutes(data);
          if (!origin.trim() && !dest.trim()) setTotalRoutes(data.length);
        })
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [origin, dest]);

  const filtrando = origin.trim().length > 0 || dest.trim().length > 0;
  const escopo = filtrando ? "no filtro atual" : "de todas as rotas";

  // A lista sai daqui INTEIRA: quem corta e' a DataTable, depois de ordenar.
  const filtradas = useMemo(
    () =>
      soRelevantes
        ? routes.filter((route) => route.total_flights >= MIN_FLIGHTS_ROUTE_TABLE)
        : routes,
    [routes, soRelevantes],
  );

  return (
    <div className="page">
      <FilterBar
        label="Filtrar rota"
        fields={[
          {
            placeholder: "Origem (ex: JFK)",
            value: origin,
            maxLength: 5,
            onChange: (value) => setOrigin(value.toUpperCase()),
          },
          {
            placeholder: "Destino (ex: LAX)",
            value: dest,
            maxLength: 5,
            onChange: (value) => setDest(value.toUpperCase()),
          },
        ]}
        toggles={[
          {
            label: `Só com ≥ ${num(MIN_FLIGHTS_ROUTE_TABLE)} voos`,
            checked: soRelevantes,
            onChange: setSoRelevantes,
          },
        ]}
        onClear={() => {
          setOrigin("");
          setDest("");
          setSoRelevantes(true);
        }}
        count={
          totalRoutes === null
            ? "carregando…"
            : `${num(filtradas.length)} de ${num(totalRoutes)} rotas`
        }
      />

      {(loading || error) && <PageState loading={loading} error={error} skeletons={2} />}

      {!loading && !error && (
        <div className="card-grid">
          <ChartCard
            title="Top rotas por volume"
            hint={`top ${TOP_N} ${escopo}`}
            source="gold.route_performance"
            metric="total_flights por par origem–destino"
            unit="voos"
          >
            <BarList
              items={routeVolumeItems(routes, TOP_N)}
              color={CHART_COLORS.navy}
              format={(value) => num(value)}
              seriesName="Total de voos"
              labelWidth={78}
            />
          </ChartCard>

          <ChartCard
            title="Top rotas por atraso médio"
            hint={`top ${TOP_N} ${escopo}`}
            source="gold.route_performance"
            metric="average_arrival_delay (rotas com mais de 2.000 voos)"
            unit="minutos"
          >
            <BarList
              items={routeDelayItems(routes, TOP_N)}
              color={CHART_COLORS.delay}
              format={(value) => mins(value)}
              seriesName="Atraso médio de chegada"
              labelWidth={78}
            />
          </ChartCard>
        </div>
      )}

      <DataTable
        title="Detalhe por rota"
        hint={`${num(filtradas.length)} rotas · clique no cabeçalho para ordenar`}
        source="gold.route_performance"
        metric="total_flights, average_arrival_delay e average_distance por par origem–destino"
        unit="voos, minutos e milhas"
        loading={loading}
        error={error}
        data={filtradas}
        rowLimit={TABLE_ROWS}
        defaultSort={{ header: "Total de voos", direction: "desc" }}
        emptyMessage="Nenhuma rota encontrada para esse filtro."
        columns={[
          {
            header: "Origem",
            render: (r) => <CodeCell code={r.origin} name={r.origin_name} />,
            sortValue: (r) => r.origin,
          },
          {
            header: "Destino",
            render: (r) => <CodeCell code={r.dest} name={r.dest_name} />,
            sortValue: (r) => r.dest,
          },
          {
            header: "Total de voos",
            align: "right",
            render: (r) => num(r.total_flights),
            sortValue: (r) => r.total_flights,
          },
          {
            header: "Atraso médio (chegada)",
            align: "right",
            render: (r) => mins(r.average_arrival_delay),
            sortValue: (r) => r.average_arrival_delay,
          },
          {
            header: "Distância média",
            align: "right",
            render: (r) => miles(r.average_distance),
            sortValue: (r) => r.average_distance,
          },
        ]}
      />
    </div>
  );
}
