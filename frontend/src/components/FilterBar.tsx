import "./FilterBar.css";

export interface FilterField {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  /** Campo de texto livre: precisa de mais largura que uma sigla de 3 letras. */
  wide?: boolean;
}

export interface FilterToggle {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface FilterBarProps {
  label: string;
  fields: FilterField[];
  /** Ex.: o piso de volume dos rankings (Decisao 05). */
  toggles?: FilterToggle[];
  onClear: () => void;
  /** Ex.: "12 de 6.805 rotas". */
  count: string;
}

export default function FilterBar({
  label,
  fields,
  toggles = [],
  onClear,
  count,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      <span className="filter-bar__label">{label}</span>
      {fields.map((field) => (
        <input
          key={field.placeholder}
          className={`filter-bar__input${field.wide ? " filter-bar__input--wide" : ""}`}
          placeholder={field.placeholder}
          value={field.value}
          maxLength={field.maxLength}
          onChange={(event) => field.onChange(event.target.value)}
        />
      ))}
      {toggles.map((toggle) => (
        <label key={toggle.label} className="filter-bar__toggle">
          <input
            type="checkbox"
            checked={toggle.checked}
            onChange={(event) => toggle.onChange(event.target.checked)}
          />
          <span>{toggle.label}</span>
        </label>
      ))}
      <button type="button" className="filter-bar__clear" onClick={onClear}>
        Limpar
      </button>
      <span className="filter-bar__spacer" />
      <span className="filter-bar__count">{count}</span>
    </div>
  );
}
