/**
 * Formatacao pt-BR compartilhada por graficos, tabelas e KPIs.
 * Tudo que entra aqui vem das tabelas Gold — nada e' derivado ou inventado.
 */

/** 1419419 -> "1.419.419" */
export function num(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("pt-BR");
}

/** 0.1962 -> "19,62%" (as colunas *_rate chegam como fracao) */
export function pct(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(digits).replace(".", ",")}%`;
}

/** 5.13 -> "5,1 min" */
export function mins(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(digits).replace(".", ",")} min`;
}

/** 337 -> "337 mi" (average_distance vem em milhas) */
export function miles(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value).toLocaleString("pt-BR")} mi`;
}

export const MONTH_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export const MONTH_LONG = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function monthShort(month: number): string {
  return MONTH_SHORT[month - 1] ?? String(month);
}

export function monthLong(month: number): string {
  return MONTH_LONG[month - 1] ?? String(month);
}

/** Ordena por uma metrica (desc) e corta no Top N, ignorando nulos. */
export function topBy<T>(rows: T[], get: (row: T) => number | null, limit: number): T[] {
  return [...rows]
    .filter((row) => get(row) !== null)
    .sort((a, b) => (get(b) ?? 0) - (get(a) ?? 0))
    .slice(0, limit);
}

/**
 * Formata um valor cru vindo do /chat, onde nao ha' tipagem por coluna.
 * Espelha a regra do backend (`_formatar_valor` em ai_agent.py): colunas
 * *_rate chegam como fracao e viram percentual; o resto vira numero pt-BR.
 */
export function formatCell(column: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "sim" : "não";

  if (typeof value === "number") {
    if (column.toLowerCase().includes("rate")) return pct(value);
    if (Number.isInteger(value)) return num(value);
    return value.toFixed(2).replace(".", ",");
  }

  return String(value);
}

/**
 * Nome da tabela consultada, extraido do SQL para a linha de meta do chat.
 * Sai com o prefixo "gold." porque a whitelist do agente so' expoe tabelas
 * Gold — e' assim que o resto do app rotula as fontes.
 */
export function tableFromSql(sql: string | null): string | null {
  if (!sql) return null;
  const match = /\bFROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/i.exec(sql);
  return match ? `gold.${match[1]}` : null;
}
