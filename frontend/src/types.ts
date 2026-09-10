export interface AirlinePerformance {
  op_unique_carrier: string;
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
  airport: string;
  total_flights: number;
  delayed_flights: number;
  average_departure_delay: number | null;
  cancelled_flights: number;
  delay_rate: number | null;
  cancellation_rate: number | null;
}

export interface RoutePerformance {
  origin: string;
  dest: string;
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
  average_delay_rate: number | null;
  average_arrival_delay: number | null;
  average_cancellation_rate: number | null;
  most_punctual_airline: string | null;
  most_delayed_airport: string | null;
}

export interface ChatResponse {
  question: string;
  sql: string | null;
  results: Record<string, unknown>[] | null;
  answer: string;
  blocked: boolean;
}
