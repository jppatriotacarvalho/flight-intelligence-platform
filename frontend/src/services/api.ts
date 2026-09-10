import type {
  AirlinePerformance,
  AirportPerformance,
  RoutePerformance,
  DelayCauses,
  FlightTrend,
  DashboardSummary,
  ChatResponse,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Erro ${response.status} ao buscar ${path}`);
  }
  return response.json() as Promise<T>;
}

export function getDashboard(): Promise<DashboardSummary> {
  return fetchJson<DashboardSummary>("/dashboard");
}

export function getAirlines(): Promise<AirlinePerformance[]> {
  return fetchJson<AirlinePerformance[]>("/airlines");
}

export function getAirports(): Promise<AirportPerformance[]> {
  return fetchJson<AirportPerformance[]>("/airports");
}

export function getRoutes(params?: {
  origin?: string;
  destination?: string;
}): Promise<RoutePerformance[]> {
  const query = new URLSearchParams();
  if (params?.origin) query.set("origin", params.origin);
  if (params?.destination) query.set("destination", params.destination);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return fetchJson<RoutePerformance[]>(`/routes${suffix}`);
}

export function getDelayCauses(): Promise<DelayCauses> {
  return fetchJson<DelayCauses>("/delays");
}

export function getTrends(month?: number): Promise<FlightTrend[]> {
  const suffix = month ? `?month=${month}` : "";
  return fetchJson<FlightTrend[]>(`/trends${suffix}`);
}

export async function askQuestion(question: string): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!response.ok) {
    throw new Error(`Erro ${response.status} ao consultar o agente de IA`);
  }
  return response.json() as Promise<ChatResponse>;
}
