import { useEffect, useState } from "react";
import { CalendarDays, FileText, Users, Wallet } from "lucide-react";
import { dashboardApi } from "../api/endpoints";
import type { DashboardResumen } from "../types/entities";
import SectionHeader from "../components/ui/SectionHeader";
import Loader from "../components/ui/Loader";
import StatCard from "../components/ui/StatCard";
import { formatCurrency } from "../utils/format";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResumen | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.resumen().then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  return <div><SectionHeader title="Dashboard" subtitle="Resumen general del sistema." />{loading ? <Loader /> : data && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><StatCard title="Clientes" value={String(data.totalClientes)} icon={Users} /><StatCard title="Servicios activos" value={String(data.totalServiciosActivos)} icon={FileText} /><StatCard title="Contratos" value={String(data.totalContratos)} icon={FileText} /><StatCard title="Cobrado" value={formatCurrency(data.totalCobrado)} icon={Wallet} /><StatCard title="Agenda pendiente" value={String(data.totalReunionesProgramadas)} icon={CalendarDays} /></div>}</div>;
}
