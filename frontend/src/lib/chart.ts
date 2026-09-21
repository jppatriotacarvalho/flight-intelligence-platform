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

/** Top N padrao dos graficos (o handoff preve 5–20, default 10). */
export const TOP_N = 10;

/** Top N dos cards do dashboard, onde o espaco e' menor. */
export const TOP_N_DASHBOARD = 8;
