import type {
  AirlinePerformance,
  AirportPerformance,
  DelayCauses,
  RoutePerformance,
} from "../types";
import type { BarItem } from "../components/BarList";
import type { CauseSlice } from "../components/CauseDonut";
import {
  CHART_COLORS,
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

export function routeLabel(route: RoutePerformance): string {
  return `${route.origin}\u2192${route.dest}`;
}

export function routeVolumeItems(routes: RoutePerformance[], limit: number): BarItem[] {
  return topBy(routes, (r) => r.total_flights, limit).map((route) => ({
    label: routeLabel(route),
    value: route.total_flights,
  }));
}

export function routeDelayItems(routes: RoutePerformance[], limit: number): BarItem[] {
  const relevantes = routes.filter(
    (route) => route.total_flights > MIN_FLIGHTS_FOR_DELAY_RANKING,
  );
  return topBy(relevantes, (r) => r.average_arrival_delay, limit).map((route) => ({
    label: routeLabel(route),
    value: route.average_arrival_delay ?? 0,
  }));
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

/** Os cinco motivos oficiais do BTS, do maior para o menor. */
export function causeSlices(causes: DelayCauses | null): CauseSlice[] {
  if (!causes) return [];
  return [
    {
      name: "Aeronave anterior",
      value: causes.total_late_aircraft_delay ?? 0,
      color: CHART_COLORS.lateAircraft,
    },
    {
      name: "Companhia aérea",
      value: causes.total_carrier_delay ?? 0,
      color: CHART_COLORS.accent,
    },
    {
      name: "Sistema Aéreo Nacional (NAS)",
      value: causes.total_nas_delay ?? 0,
      color: CHART_COLORS.delay,
    },
    { name: "Clima", value: causes.total_weather_delay ?? 0, color: CHART_COLORS.positive },
    {
      name: "Segurança",
      value: causes.total_security_delay ?? 0,
      color: CHART_COLORS.cancel,
    },
  ].sort((a, b) => b.value - a.value);
}
