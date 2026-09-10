import { NavLink, Outlet } from "react-router-dom";
import "./Layout.css";

export default function Layout() {
  return (
    <div className="layout">
      <header className="layout__header">
        <h1 className="layout__title">✈️ Flight Intelligence Platform</h1>
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
      </header>

      <main className="layout__content">
        <Outlet />
      </main>
    </div>
  );
}
