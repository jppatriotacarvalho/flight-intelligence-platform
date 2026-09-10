import "./DataTable.css";

interface Column<T> {
  header: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[] | null;
  loading: boolean;
  error: string | null;
  emptyMessage?: string;
}

export default function DataTable<T>({
  columns,
  data,
  loading,
  error,
  emptyMessage = "Nenhum resultado encontrado.",
}: DataTableProps<T>) {
  if (loading) {
    return <p className="data-table__status">Carregando...</p>;
  }

  if (error) {
    return <p className="data-table__status data-table__status--error">{error}</p>;
  }

  if (!data || data.length === 0) {
    return <p className="data-table__status">{emptyMessage}</p>;
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.header}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index}>
            {columns.map((col) => (
              <td key={col.header}>{col.render(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
