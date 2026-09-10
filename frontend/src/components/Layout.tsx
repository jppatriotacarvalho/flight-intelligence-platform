import { NavLink, Outlet } from "react-router-dom";
import "./Layout.css";

export default function Layout() {
  return (
    <div className="layout">
      <aside className="layout__sidebar">
        <div className="layout__brand">
          <span className="layout__brand-mark" />
          <h1 className="layout__title">Flight Intelligence</h1>
        </div>
        <nav className="layout__nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/companhias">Companhias</NavLink>
          <NavLink to="/aeroportos">Aeroportos</NavLink>
          <NavLink to="/rotas">Rotas</NavLink>
          <NavLink to="/atrasos">Atrasos</NavLink>
          <NavLink to="/chat">Chat IA</NavLink>
        </nav>
      </aside>

      <main className="layout__content">
        <Outlet />
      </main>
    </div>
  );
}
