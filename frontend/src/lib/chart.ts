/**
 * Constantes visuais compartilhadas pelos graficos Recharts.
 * Os valores espelham os tokens de theme.css — Recharts recebe cores por
 * prop, entao nao da' para usar var(--...) direto nos elementos SVG.
 */

export const CHART_COLORS = {
  accent: "#4f8ff7",
  navy: "#1a2b4c",
  delay: "#f79b4f",
  cancel: "#e05c5c",
  positive: "#4fc78f",
  lateAircraft: "#a05cf7",
};

export const AXIS_COLOR = "#6b7280";
export const GRID_COLOR = "#eef1f6";
export const TRACK_COLOR = "#eef1f6";

export const TOOLTIP_STYLE = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  boxShadow: "0 1px 3px rgba(16,24,40,.05)",
  color: "#1a1a1a",
  fontSize: 12.5,
  padding: "8px 12px",
} as const;

export const TOOLTIP_LABEL_STYLE = {
  color: "#1a2b4c",
  fontWeight: 600,
  marginBottom: 2,
} as const;

/**
 * Piso de volume dos rankings (Decisao 05). Sem piso, ordenar por taxa leva
 * amostras minusculas para o topo: EWN, com 51 voos, tem 7,84% de
 * cancelamento, e MGW, com 37 voos, 72 min de atraso medio de partida.
 */

/** Rotas abaixo disto ficam de fora do ranking de atraso medio. */
export const MIN_FLIGHTS_FOR_DELAY_RANKING = 2000;

/** Com um filtro de origem/destino ativo, o universo e' pequeno e o piso cai. */
export const MIN_FLIGHTS_FOR_DELAY_RANKING_FILTERED = 50;

/**
 * Quantos aeroportos entram no recorte de "mais movimentados" usado pelos
 * rankings por taxa. Espelha POOL_AEROPORTOS_MOVIMENTADOS em
 * backend/app/routers/dashboard.py — o KPI e o grafico precisam do mesmo
 * recorte, senao um mostra MGW e o outro DFW.
 */
export const POOL_AEROPORTOS_MOVIMENTADOS = 20;

/** Piso do checkbox "So com >= N voos" da tabela de Aeroportos. */
export const MIN_FLIGHTS_AIRPORT_TABLE = 1000;

/** Piso do checkbox "So com >= N voos" da tabela de Rotas. */
export const MIN_FLIGHTS_ROUTE_TABLE = 100;

/** Top N padrao dos graficos (o handoff preve 5–20, default 10). */
export const TOP_N = 10;

/** Top N dos cards do dashboard, onde o espaco e' menor. */
export const TOP_N_DASHBOARD = 8;
