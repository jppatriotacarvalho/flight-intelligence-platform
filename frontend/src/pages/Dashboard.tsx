import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  getDashboard,
  getAirlines,
  getAirports,
  getDelayCauses,
  getTrends,
} from "../services/api";
import type {
  DashboardSummary,
  AirlinePerformance,
  AirportPerformance,
  DelayCauses,
  FlightTrend,
} from "../types";
import ChartCard from "../components/ChartCard";
import "./Dashboard.css";

const MONTH_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const PIE_COLORS = ["#4f8ff7", "#f79b4f", "#4fc78f", "#e05c5c", "#a05cf7"];

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [airlines, setAirlines] = useState<AirlinePerformance[] | null>(null);
  const [airports, setAirports] = useState<AirportPerformance[] | null>(null);
  const [causes, setCauses] = useState<DelayCauses | null>(null);
  const [trends, setTrends] = useState<FlightTrend[] | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getDashboard(),
      getAirlines(),
      getAirports(),
      getDelayCauses(),
      getTrends(),
    ])
      .then(([s, a, ap, c, t]) => {
        setSummary(s);
        setAirlines(a);
        setAirports(ap);
        setCauses(c);
        setTrends(t);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Carregando dashboard...</p>;
  if (error) return <p className="dashboard__error">Erro: {error}</p>;
  if (!summary) return null;

  const formatPercent = (value: number | null) =>
    value !== null ? `${(value * 100).toFixed(2)}%` : "—";

  const formatMinutes = (value: number | null) =>
    value !== null ? `${value.toFixed(1)} min` : "—";

  const airlineChartData = airlines
    ? [...airlines]
        .sort((a, b) => (b.delay_rate ?? 0) - (a.delay_rate ?? 0))
        .map((r) => ({
          companhia: r.op_unique_carrier,
          taxa_atraso: r.delay_rate !== null ? Number((r.delay_rate * 100).toFixed(2)) : 0,
        }))
    : [];

  const airportChartData = airports
    ? [...airports]
        .sort((a, b) => b.total_flights - a.total_flights)
        .slice(0, 10)
        .sort((a, b) => (b.delay_rate ?? 0) - (a.delay_rate ?? 0))
        .map((r) => ({
          aeroporto: r.airport,
          taxa_atraso: r.delay_rate !== null ? Number((r.delay_rate * 100).toFixed(2)) : 0,
        }))
    : [];

  const pieData = causes
    ? [
        { name: "Companhia Aérea", value: causes.total_carrier_delay ?? 0 },
        { name: "Clima", value: causes.total_weather_delay ?? 0 },
        { name: "Sistema Aéreo Nacional (NAS)", value: causes.total_nas_delay ?? 0 },
        { name: "Segurança", value: causes.total_security_delay ?? 0 },
        { name: "Aeronave Anterior", value: causes.total_late_aircraft_delay ?? 0 },
      ]
    : [];

  const trendChartData = trends
    ? trends.map((t) => ({
        mes: MONTH_SHORT[t.month - 1] ?? t.month,
        taxa_atraso: t.delay_rate !== null ? Number((t.delay_rate * 100).toFixed(2)) : 0,
      }))
    : [];

  return (
    <div>
      <h2>Visão Geral</h2>
      <div className="dashboard__grid">
        <div className="dashboard__card">
          <span className="dashboard__label">Total de Voos</span>
          <span className="dashboard__value">
            {summary.total_flights.toLocaleString("pt-BR")}
          </span>
        </div>
        <div className="dashboard__card">
          <span className="dashboard__label">Taxa de Atraso Média</span>
          <span className="dashboard__value">
            {formatPercent(summary.average_delay_rate)}
          </span>
        </div>
        <div className="dashboard__card">
          <span className="dashboard__label">Atraso Médio (Chegada)</span>
          <span className="dashboard__value">
            {formatMinutes(summary.average_arrival_delay)}
          </span>
        </div>
        <div className="dashboard__card">
          <span className="dashboard__label">Taxa de Cancelamento Média</span>
          <span className="dashboard__value">
            {formatPercent(summary.average_cancellation_rate)}
          </span>
        </div>
        <div className="dashboard__card">
          <span className="dashboard__label">Companhia Mais Pontual</span>
          <span className="dashboard__value">
            {summary.most_punctual_airline ?? "—"}
          </span>
        </div>
        <div className="dashboard__card">
          <span className="dashboard__label">Aeroporto Mais Atrasado</span>
          <span className="dashboard__value">
            {summary.most_delayed_airport ?? "—"}
          </span>
        </div>
      </div>

      <h2 style={{ marginTop: "2.5rem" }}>Análise Visual</h2>

      {airlineChartData.length > 0 && (
        <ChartCard
          title="Taxa de Atraso por Companhia"
          source="gold.airline_performance"
          metric="% de voos com atraso de chegada > 15 min"
          unit="%"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={airlineChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="companhia" />
              <YAxis unit="%" />
              <Tooltip formatter={(value: any) => [`${value}%`, "Taxa de Atraso"]} />
              <Bar dataKey="taxa_atraso" fill="#4f8ff7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {airportChartData.length > 0 && (
        <ChartCard
          title="Taxa de Atraso — Top 10 Aeroportos Mais Movimentados"
          source="gold.airport_performance"
          metric="% de voos com atraso de chegada > 15 min"
          unit="%"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={airportChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="aeroporto" />
              <YAxis unit="%" />
              <Tooltip formatter={(value: any) => [`${value}%`, "Taxa de Atraso"]} />
              <Bar dataKey="taxa_atraso" fill="#f79b4f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {pieData.length > 0 && (
        <ChartCard
          title="Distribuição dos Motivos de Atraso"
          source="gold.delay_causes"
          metric="Soma de minutos de atraso atribuídos a cada motivo"
          unit="minutos"
        >
          <div className="dashboard__pie-wrapper">
            <PieChart width={420} height={300}>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={(entry) => entry.name}
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => value.toLocaleString("pt-BR")} />
              <Legend />
            </PieChart>
          </div>
        </ChartCard>
      )}

      {trendChartData.length > 0 && (
        <ChartCard
          title="Taxa de Atraso ao Longo do Ano"
          source="gold.flight_trends"
          metric="% de voos com atraso de chegada > 15 min, por mês"
          unit="%"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis unit="%" />
              <Tooltip formatter={(value: any) => [`${value}%`, "Taxa de Atraso"]} />
              <Line
                type="monotone"
                dataKey="taxa_atraso"
                stroke="#4f8ff7"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}
