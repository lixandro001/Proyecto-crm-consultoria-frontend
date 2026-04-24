import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ClientesPage from "./pages/ClientesPage";
import ServiciosPage from "./pages/ServiciosPage";
import ClienteServiciosPage from "./pages/ClienteServiciosPage";
import PlantillasPage from "./pages/PlantillasPage";
import ContratosPage from "./pages/ContratosPage";
import AgendaPage from "./pages/AgendaPage";
import PagosPage from "./pages/PagosPage";
import UsersPage from "./pages/UsersPage";
import AlertModal from "./components/ui/AlertModal";
import { useAlert } from "./context/AlertContext";

export default function App() {
  const { state, closeAlert } = useAlert();
  return <>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="servicios" element={<ServiciosPage />} />
        <Route path="cliente-servicios" element={<ClienteServiciosPage />} />
        <Route path="plantillas" element={<PlantillasPage />} />
        <Route path="contratos" element={<ContratosPage />} />
        <Route path="agenda" element={<AgendaPage />} />
        <Route path="pagos" element={<PagosPage />} />
        <Route path="usuarios" element={<UsersPage />} />
      </Route>
    </Routes>
    <AlertModal open={state.open} title={state.title} message={state.message} type={state.type} onClose={closeAlert} />
  </>;
}
