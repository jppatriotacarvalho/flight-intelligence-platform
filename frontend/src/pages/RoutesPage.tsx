import { useEffect, useState } from "react";
import { getRoutes } from "../services/api";
import type { RoutePerformance } from "../types";
import AirportCell from "../components/AirportCell";
import BarList from "../components/BarList";
import ChartCard from "../components/ChartCard";
import DataTable from "../components/DataTable";
import FilterBar from "../components/FilterBar";
import PageState from "../components/PageState";
import { CHART_COLORS, TOP_N } from "../lib/chart";
import { miles, mins, num, topBy } from "../lib/format";
import { routeDelayItems, routeVolumeItems } from "./chartData";

/** O filtro vai ao servidor; esperar o usuario parar de digitar evita
 *  disparar uma requisicao por tecla. */
const DEBOUNCE_MS = 350;

/** Sao 6.805 rotas: renderizar todas travaria a pagina. A busca por
 *  origem/destino e' o caminho para chegar as demais. */
const TABLE_ROWS = 100;

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RoutePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [origin, setOrigin] = useState("");
  const [dest, setDest] = useState("");

  /** Total sem filtro, guardado na primeira carga para o contador. */
  const [totalRoutes, setTotalRoutes] = useState<number | null>(null);

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
  const porVolume = topBy(routes, (r) => r.total_flights, TABLE_ROWS);
  const escopo = filtrando ? "no filtro atual" : "de todas as rotas";

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
        onClear={() => {
          setOrigin("");
          setDest("");
        }}
        count={
          totalRoutes === null
            ? "carregando…"
            : `${num(routes.length)} de ${num(totalRoutes)} rotas`
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
        hint={
          routes.length > TABLE_ROWS
            ? `${TABLE_ROWS} primeiras de ${num(routes.length)} · ordenadas por volume`
            : `${num(routes.length)} rotas · ordenadas por volume`
        }
        source="gold.route_performance"
        metric="total_flights, average_arrival_delay e average_distance por par origem–destino"
        unit="voos, minutos e milhas"
        loading={loading}
        error={error}
        data={porVolume}
        emptyMessage="Nenhuma rota encontrada para esse filtro."
        columns={[
          {
            header: "Origem",
            render: (r) => <AirportCell code={r.origin} name={r.origin_name} />,
          },
          {
            header: "Destino",
            render: (r) => <AirportCell code={r.dest} name={r.dest_name} />,
          },
          { header: "Total de voos", align: "right", render: (r) => num(r.total_flights) },
          {
            header: "Atraso médio (chegada)",
            align: "right",
            render: (r) => mins(r.average_arrival_delay),
          },
          {
            header: "Distância média",
            align: "right",
            render: (r) => miles(r.average_distance),
          },
        ]}
      />
    </div>
  );
}
