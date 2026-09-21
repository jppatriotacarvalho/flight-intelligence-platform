import "./SectionHeader.css";

interface SectionHeaderProps {
  title: string;
  /** Ex.: "perguntas 1 a 4" — liga o bloco as perguntas de negocio. */
  hint?: string;
}

export default function SectionHeader({ title, hint }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <h3 className="section-header__title">{title}</h3>
      {hint && <span className="section-header__hint">{hint}</span>}
      <span className="section-header__rule" />
    </div>
  );
}
