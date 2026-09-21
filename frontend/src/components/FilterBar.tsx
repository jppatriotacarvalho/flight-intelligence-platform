import "./FilterBar.css";

export interface FilterField {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

interface FilterBarProps {
  label: string;
  fields: FilterField[];
  onClear: () => void;
  /** Ex.: "12 de 6.805 rotas". */
  count: string;
}

export default function FilterBar({ label, fields, onClear, count }: FilterBarProps) {
  return (
    <div className="filter-bar">
      <span className="filter-bar__label">{label}</span>
      {fields.map((field) => (
        <input
          key={field.placeholder}
          className="filter-bar__input"
          placeholder={field.placeholder}
          value={field.value}
          maxLength={field.maxLength}
          onChange={(event) => field.onChange(event.target.value)}
        />
      ))}
      <button type="button" className="filter-bar__clear" onClick={onClear}>
        Limpar
      </button>
      <span className="filter-bar__spacer" />
      <span className="filter-bar__count">{count}</span>
    </div>
  );
}
