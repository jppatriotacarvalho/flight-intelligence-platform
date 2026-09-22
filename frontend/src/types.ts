export interface AirlinePerformance {
  op_unique_carrier: string;
  /** Nome oficial (Decisao 04) — derivado do codigo no backend, nao vem do MySQL. */
  airline_name: string | null;
  /** Nome curto, para caber no rotulo de um grafico de barras. */
  airline_short_name: string | null;
  total_flights: number;
  delayed_flights: number;
  average_departure_delay: number | null;
  average_arrival_delay: number | null;
  cancelled_flights: number;
  diverted_flights: number;
  delay_rate: number | null;
  cancellation_rate: number | null;
}

export interface AirportPerformance {
  /** Sigla IATA — e' a chave da tabela. */
  airport: string;
  /** Cidade/UF vinda de silver.dim_airports ("Atlanta, GA"). */
  airport_name: string | null;
  airport_city: string | null;
  airport_state: string | null;
  /** Rotulo pronto: "ATL - Atlanta, GA". */
  airport_label: string | null;
  total_flights: number;
  delayed_flights: number;
  average_departure_delay: number | null;
  cancelled_flights: number;
  delay_rate: number | null;
  cancellation_rate: number | null;
}

export interface RoutePerformance {
  origin: string;
  origin_name: string | null;
  dest: string;
  dest_name: string | null;
  total_flights: number;
  average_arrival_delay: number | null;
  average_distance: number | null;
}

export interface DelayCauses {
  total_carrier_delay: number | null;
  total_weather_delay: number | null;
  total_nas_delay: number | null;
  total_security_delay: number | null;
  total_late_aircraft_delay: number | null;
}

export interface FlightTrend {
  month: number;
  total_flights: number;
  delayed_flights: number;
  average_arrival_delay: number | null;
  delay_rate: number | null;
}

export interface DashboardSummary {
  total_flights: number;
  /** Soma dos atrasados / soma do total — nao e' a media das 15 taxas. */
  delay_rate: number | null;
  average_arrival_delay: number | null;
  cancellation_rate: number | null;
  most_punctual_airline: string | null;
  most_punctual_airline_name: string | null;
  most_punctual_airline_delay_rate: number | null;
  most_delayed_airport: string | null;
  most_delayed_airport_name: string | null;
  /** Minutos de atraso medio de partida do aeroporto do KPI. */
  most_delayed_airport_delay: number | null;
}

export interface ChatResponse {
  question: string;
  sql: string | null;
  results: Record<string, unknown>[] | null;
  answer: string;
  blocked: boolean;
  /** Modelo da cadeia de fallback que realmente respondeu. */
  model: string | null;
}
