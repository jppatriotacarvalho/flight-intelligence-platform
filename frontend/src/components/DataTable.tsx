import type { ReactNode } from "react";
import "./DataTable.css";

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  /** Colunas numericas alinham a' direita. */
  align?: "left" | "right";
  /** Codigos IATA e meses usam a fonte mono em navy. */
  mono?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[] | null;
  loading: boolean;
  error: string | null;
  /** Cabecalho do card. */
  title: string;
  hint?: string;
  /** Rodape de transparencia. */
  source: string;
  metric: string;
  unit: string;
  emptyMessage?: string;
}

export default function DataTable<T>({
  columns,
  data,
  loading,
  error,
  title,
  hint,
  source,
  metric,
  unit,
  emptyMessage = "Nenhum resultado encontrado.",
}: DataTableProps<T>) {
  return (
    <div className="data-table__card">
      <div className="data-table__header">
        <h4 className="data-table__title">{title}</h4>
        {hint && <span className="data-table__hint">{hint}</span>}
      </div>

      {loading && (
        <div className="data-table__status">
          <span className="spinner" aria-hidden="true" />
          <span>Carregando...</span>
        </div>
      )}

      {!loading && error && (
        <p className="data-table__status data-table__status--error">{error}</p>
      )}

      {!loading && !error && (!data || data.length === 0) && (
        <p className="data-table__status">{emptyMessage}</p>
      )}

      {!loading && !error && data && data.length > 0 && (
        <div className="data-table__wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.header} style={{ textAlign: col.align ?? "left" }}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index}>
                  {columns.map((col) => (
                    <td
                      key={col.header}
                      className={col.mono ? "data-table__cell--mono" : undefined}
                      style={{ textAlign: col.align ?? "left" }}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="data-table__caption">
        <strong>Fonte:</strong> <span className="data-table__source">{source}</span> ·{" "}
        <strong>Métrica:</strong> {metric} · <strong>Unidade:</strong> {unit}
      </p>
    </div>
  );
}
