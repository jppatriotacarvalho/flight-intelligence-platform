import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Airlines from "./pages/Airlines";
import Airports from "./pages/Airports";
import RoutesPage from "./pages/RoutesPage";
import Delays from "./pages/Delays";
import Chat from "./pages/Chat";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="companhias" element={<Airlines />} />
          <Route path="aeroportos" element={<Airports />} />
          <Route path="rotas" element={<RoutesPage />} />
          <Route path="atrasos" element={<Delays />} />
          <Route path="chat" element={<Chat />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
