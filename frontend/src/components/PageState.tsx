
interface PageStateProps {
  loading: boolean;
  error: string | null;
  /** Quantos cards-esqueleto mostrar enquanto carrega. */
  skeletons?: number;
  /** Esqueletos baixos, do tamanho de um KPI. */
  kpi?: boolean;
}

/**
 * Estado de carregamento/erro no nivel da pagina.
 * Retorna null quando ha' dados — a pagina segue renderizando normalmente.
 */
export default function PageState({ loading, error, skeletons = 0, kpi }: PageStateProps) {
  if (error) {
    return <p className="page-status page-status--error">Erro: {error}</p>;
  }

  if (!loading) return null;

  if (skeletons > 0) {
    return (
      <div className={kpi ? "kpi-grid" : "card-grid"}>
        {Array.from({ length: skeletons }, (_, index) => (
          <div
            key={index}
            className={`skeleton-card${kpi ? " skeleton-card--kpi" : ""}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="page-status">
      <span className="spinner" aria-hidden="true" />
      <span>Carregando...</span>
    </div>
  );
}
