import type {
  AirlinePerformance,
  AirportPerformance,
  DelayCauses,
  RoutePerformance,
} from "../types";
import type { BarItem } from "../components/BarList";
import type { CauseSlice } from "../components/CauseDonut";
import {
  CAUSE_COLORS,
  MIN_FLIGHTS_FOR_DELAY_RANKING,
  POOL_AEROPORTOS_MOVIMENTADOS,
} from "../lib/chart";
import { topBy } from "../lib/format";

/**
 * Serie por companhia com o nome curto no eixo e "YX · Republic Airways" no
 * tooltip: o codigo sozinho nao e' reconhecivel, e o nome completo nao cabe
 * na coluna de rotulos (Decisao 04).
 */
export function airlineItems(
  airlines: AirlinePerformance[],
  get: (row: AirlinePerformance) => number | null,
  limit = airlines.length,
): BarItem[] {
  return topBy(airlines, get, limit).map((airline) => ({
    label: airline.airline_short_name ?? airline.op_unique_carrier,
    value: get(airline) ?? 0,
    tooltip: airline.airline_name
      ? `${airline.op_unique_carrier} · ${airline.airline_name}`
      : airline.op_unique_carrier,
  }));
}

/**
 * Media do setor ponderada por volume (Soma / Soma), para a linha de
 * referencia dos graficos por companhia. NAO e' a media das 15 taxas: essa
 * daria o mesmo peso a Hawaiian (78 mil voos) e a Southwest (1,4 milhao).
 */
export function airlineWeightedAverage(
  airlines: AirlinePerformance[],
  get: (row: AirlinePerformance) => number | null,
): number | null {
  let numerador = 0;
  let denominador = 0;

  for (const airline of airlines) {
    const valor = get(airline);
    if (valor === null) continue;
    numerador += valor * airline.total_flights;
    denominador += airline.total_flights;
  }

  return denominador > 0 ? numerador / denominador : null;
}

export function routeLabel(route: RoutePerformance): string {
  return `${route.origin}→${route.dest}`;
}

/**
 * Ranking de rotas por atraso medio, com piso de volume (Decisao 05).
 * Continua por SENTIDO, e nao por par: o atraso de JFK->LAX nao e' o mesmo
 * de LAX->JFK, entao somar os dois sentidos inventaria um numero.
 */
export function routeDelayItems(
  routes: RoutePerformance[],
  limit: number,
  minFlights = MIN_FLIGHTS_FOR_DELAY_RANKING,
): BarItem[] {
  const relevantes = routes.filter((route) => route.total_flights >= minFlights);
  return topBy(relevantes, (r) => r.average_arrival_delay, limit).map((route) => ({
    label: routeLabel(route),
    value: route.average_arrival_delay ?? 0,
  }));
}

/**
 * Agrupa ida e volta no mesmo item: sem isso o top 8 por volume tinha so' 4
 * pares de cidades (OGG->HNL e HNL->OGG, LAX->SFO e SFO->LAX...), gastando
 * metade do grafico repetindo a mesma ligacao.
 *
 * - "flights": soma os voos dos dois sentidos.
 * - "distance": usa a distancia, que e' a mesma nos dois sentidos.
 */
export function routePairItems(
  routes: RoutePerformance[],
  limit: number,
  metric: "flights" | "distance",
): BarItem[] {
  const pares = new Map<string, { label: string; value: number }>();

  for (const route of routes) {
    // Chave com os codigos ordenados: JFK/LAX e LAX/JFK caem na mesma.
    const [a, b] = [route.origin, route.dest].sort();
    const chave = `${a}|${b}`;
    const label = `${a}↔${b}`;
    const atual = pares.get(chave);

    if (metric === "flights") {
      pares.set(chave, { label, value: (atual?.value ?? 0) + route.total_flights });
      continue;
    }

    const distancia = route.average_distance;
    if (distancia === null) continue;
    pares.set(chave, { label, value: Math.max(atual?.value ?? 0, distancia) });
  }

  return topBy([...pares.values()], (p) => p.value, limit);
}

export function airportVolumeItems(
  airports: AirportPerformance[],
  limit: number,
): BarItem[] {
  return topBy(airports, (r) => r.total_flights, limit).map((airport) => ({
    label: airport.airport,
    value: airport.total_flights,
  }));
}

/** Atraso medio de partida entre os aeroportos mais movimentados —
 *  sem esse recorte o topo seria tomado por aeroportos minusculos. */
export function airportDelayItems(
  airports: AirportPerformance[],
  limit: number,
  pool = POOL_AEROPORTOS_MOVIMENTADOS,
): BarItem[] {
  return topBy(
    topBy(airports, (r) => r.total_flights, pool),
    (r) => r.average_departure_delay,
    limit,
  ).map((airport) => ({
    label: airport.airport,
    value: airport.average_departure_delay ?? 0,
  }));
}

/** Taxa de cancelamento entre os aeroportos mais movimentados (pergunta 7). */
export function airportCancelItems(
  airports: AirportPerformance[],
  limit: number,
  pool = POOL_AEROPORTOS_MOVIMENTADOS,
): BarItem[] {
  return topBy(
    topBy(airports, (r) => r.total_flights, pool),
    (r) => r.cancellation_rate,
    limit,
  ).map((airport) => ({
    label: airport.airport,
    value: airport.cancellation_rate ?? 0,
  }));
}

/** Os cinco motivos oficiais do BTS, do maior para o menor. */
export function causeSlices(causes: DelayCauses | null): CauseSlice[] {
  if (!causes) return [];
  return [
    {
      name: "Aeronave anterior",
      shortName: "Aeronave ant.",
      value: causes.total_late_aircraft_delay ?? 0,
      color: CAUSE_COLORS.lateAircraft,
    },
    {
      name: "Companhia aérea",
      shortName: "Companhia",
      value: causes.total_carrier_delay ?? 0,
      color: CAUSE_COLORS.carrier,
    },
    {
      name: "Sistema Aéreo Nacional (NAS)",
      shortName: "NAS",
      value: causes.total_nas_delay ?? 0,
      color: CAUSE_COLORS.nas,
    },
    {
      name: "Clima",
      shortName: "Clima",
      value: causes.total_weather_delay ?? 0,
      color: CAUSE_COLORS.weather,
    },
    {
      name: "Segurança",
      shortName: "Segurança",
      value: causes.total_security_delay ?? 0,
      color: CAUSE_COLORS.security,
    },
  ].sort((a, b) => b.value - a.value);
}
