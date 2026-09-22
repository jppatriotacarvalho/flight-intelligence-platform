import "./DataTable.css";

interface CodeCellProps {
  /** Codigo que e' a chave da tabela Gold: sigla IATA ou codigo da companhia. */
  code: string;
  /** Nome descritivo ("Atlanta, GA", "Republic Airways"). Pode nao existir. */
  name?: string | null;
}

/**
 * Celula em duas linhas: codigo em cima, nome embaixo.
 * O codigo nao sai da tela de proposito — ele e' a chave das tabelas Gold
 * e o que o usuario digita na busca; o nome e' o contexto.
 *
 * Sem nome, a celula mostra so' o codigo: uma coluna inteira de travessoes
 * nao informa nada e ainda faz a tabela parecer quebrada.
 */
export default function CodeCell({ code, name }: CodeCellProps) {
  return (
    <div className="data-table__stack">
      <span className="data-table__stack-code">{code}</span>
      {name && <span className="data-table__stack-name">{name}</span>}
    </div>
  );
}
