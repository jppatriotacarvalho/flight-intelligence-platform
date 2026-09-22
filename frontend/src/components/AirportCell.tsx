import "./DataTable.css";

interface AirportCellProps {
  /** Sigla IATA — a chave; sempre visivel porque e' ela que identifica o aeroporto. */
  code: string;
  /** Nome vindo da Gold ("Atlanta, GA"). Null enquanto a Gold nao foi recarregada. */
  name?: string | null;
}

/**
 * Celula de aeroporto em duas linhas: sigla em cima, nome embaixo.
 * A sigla nao sai da tela de proposito — ela e' a chave das tabelas Gold
 * e o que o usuario digita na busca; o nome e' o contexto.
 *
 * Sem nome, a celula mostra so' a sigla: uma coluna inteira de travessoes
 * nao informa nada e ainda faz a tabela parecer quebrada.
 */
export default function AirportCell({ code, name }: AirportCellProps) {
  return (
    <div className="data-table__stack">
      <span className="data-table__stack-code">{code}</span>
      {name && <span className="data-table__stack-name">{name}</span>}
    </div>
  );
}
