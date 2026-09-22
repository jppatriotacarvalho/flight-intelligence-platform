import { useMemo, useState, type ReactNode } from "react";
import "./DataTable.css";

export type SortDirection = "asc" | "desc";

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  /** Colunas numericas alinham a' direita. */
  align?: "left" | "right";
  /** Codigos IATA e meses usam a fonte mono em navy. */
  mono?: boolean;
  /**
   * Valor cru usado para ordenar. Sem ele a coluna nao e' clicavel — o texto
   * renderizado ja' vem formatado ("1.419.419", "19,62%") e ordenar por ele
   * daria a ordem alfabetica, nao a numerica.
   */
  sortValue?: (row: T) => number | string | null;
}

export interface SortState {
  header: string;
  direction: SortDirection;
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
  /** Ordenacao inicial, antes de qualquer clique. */
  defaultSort?: SortState;
  /**
   * Quantas linhas aparecem de cada vez. A ordenacao roda sobre TODOS os
   * registros recebidos e so' depois a tabela corta — cortar antes faria
   * "ordenar por cancelamento" reordenar apenas os 20 maiores por volume.
   */
  rowLimit?: number;
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
  defaultSort,
  rowLimit,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(defaultSort ?? null);
  const [visiveis, setVisiveis] = useState(rowLimit ?? 0);

  // Trocar o filtro troca o conjunto: a contagem volta para a primeira pagina.
  // Ajuste durante a renderizacao, e nao num efeito: assim a tabela nunca
  // chega a pintar a lista nova com a contagem antiga.
  const [conjuntoAnterior, setConjuntoAnterior] = useState(data);
  if (conjuntoAnterior !== data) {
    setConjuntoAnterior(data);
    setVisiveis(rowLimit ?? 0);
  }

  const ordenados = useMemo(() => {
    if (!data) return null;

    const coluna = sort ? columns.find((col) => col.header === sort.header) : undefined;
    const valorDe = coluna?.sortValue;
    if (!sort || !valorDe) return data;

    const sentido = sort.direction === "asc" ? 1 : -1;

    return [...data].sort((a, b) => {
      const va = valorDe(a);
      const vb = valorDe(b);

      // Nulo vai sempre para o fim, nos dois sentidos: "sem dado" nao e' nem
      // o maior nem o menor valor, e no topo ele esconderia o ranking.
      if (va === null || va === undefined) return vb === null || vb === undefined ? 0 : 1;
      if (vb === null || vb === undefined) return -1;

      if (typeof va === "string" || typeof vb === "string") {
        return String(va).localeCompare(String(vb), "pt-BR") * sentido;
      }
      return (va - vb) * sentido;
    });
  }, [data, sort, columns]);

  const linhas = rowLimit && ordenados ? ordenados.slice(0, visiveis) : ordenados;
  const temMais = Boolean(rowLimit && ordenados && ordenados.length > visiveis);

  function alternarOrdem(coluna: Column<T>) {
    setSort((anterior) => {
      if (anterior?.header === coluna.header) {
        return {
          header: coluna.header,
          direction: anterior.direction === "asc" ? "desc" : "asc",
        };
      }

      // Numero comeca decrescente (quem clica em "Cancelamento" quer o maior);
      // texto comeca crescente, que e' a ordem alfabetica esperada.
      const amostra = data && data.length > 0 ? coluna.sortValue?.(data[0]) : null;
      return {
        header: coluna.header,
        direction: typeof amostra === "number" ? "desc" : "asc",
      };
    });
  }

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

      {!loading && !error && (!linhas || linhas.length === 0) && (
        <p className="data-table__status">{emptyMessage}</p>
      )}

      {!loading && !error && linhas && linhas.length > 0 && (
        <div className="data-table__wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) => {
                  const ativa = sort?.header === col.header;
                  return (
                    <th
                      key={col.header}
                      style={{ textAlign: col.align ?? "left" }}
                      aria-sort={
                        !col.sortValue
                          ? undefined
                          : ativa
                            ? sort?.direction === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                      }
                    >
                      {col.sortValue ? (
                        // Botao, e nao um th com onClick: e' assim que a
                        // ordenacao funciona pelo teclado e e' anunciada.
                        <button
                          type="button"
                          className={`data-table__sort${ativa ? " data-table__sort--active" : ""}`}
                          onClick={() => alternarOrdem(col)}
                        >
                          <span>{col.header}</span>
                          <span className="data-table__sort-icon" aria-hidden="true">
                            {ativa ? (sort?.direction === "asc" ? "▲" : "▼") : "▼"}
                          </span>
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {linhas.map((row, index) => (
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

      {temMais && ordenados && (
        <div className="data-table__more">
          <button
            type="button"
            className="data-table__more-button"
            onClick={() => setVisiveis((atual) => atual + (rowLimit ?? 0))}
          >
            Mostrar mais
          </button>
          <span className="data-table__more-count">
            {linhas?.length} de {ordenados.length}
          </span>
        </div>
      )}

      <p className="data-table__caption">
        <strong>Fonte:</strong> <span className="data-table__source">{source}</span> ·{" "}
        <strong>Métrica:</strong> {metric} · <strong>Unidade:</strong> {unit}
      </p>
    </div>
  );
}
