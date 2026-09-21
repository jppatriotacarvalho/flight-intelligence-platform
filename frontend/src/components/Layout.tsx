import { NavLink, Outlet, useLocation } from "react-router-dom";
import "./Layout.css";

/**
 * Metadados de cada rota: rotulo e badge da sidebar + titulo do header.
 * O badge e' a contagem de registros da tabela Gold que alimenta a pagina.
 */
const PAGES = [
  { to: "/", end: true, label: "Dashboard", badge: "16", title: "Panorama operacional 2024" },
  { to: "/companhias", label: "Companhias", badge: "15", title: "Companhias aéreas" },
  { to: "/aeroportos", label: "Aeroportos", badge: "348", title: "Aeroportos" },
  { to: "/rotas", label: "Rotas", badge: "6.8k", title: "Rotas" },
  { to: "/atrasos", label: "Atrasos", badge: "5", title: "Motivos e evolução dos atrasos" },
  { to: "/chat", label: "Chat IA", badge: "AI", title: "Chat com a IA" },
];

export default function Layout() {
  const { pathname } = useLocation();
  const current = PAGES.find((p) => (p.end ? pathname === p.to : pathname.startsWith(p.to)));

  return (
    <div className="layout">
      <aside className="layout__sidebar">
        <div className="layout__brand">
          <span className="layout__brand-mark" />
          <h1 className="layout__title">Flight Intelligence</h1>
        </div>
        <nav className="layout__nav">
          {PAGES.map((page) => (
            <NavLink key={page.to} to={page.to} end={page.end}>
              <span>{page.label}</span>
              <span className="layout__badge">{page.badge}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="layout__content">
        <header className="layout__header">
          <h2 className="layout__page-title">{current?.title ?? "Flight Intelligence"}</h2>
          <span className="layout__period">2024 · ano completo</span>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
