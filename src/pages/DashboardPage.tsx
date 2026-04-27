import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  FileText,
  Users,
  Wallet,
  TrendingUp,
  BarChart3,
  ClipboardCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
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
    dashboardApi
      .resumen()
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  const chartData = useMemo(() => {
    if (!data) return [];

    return [
      {
        label: "Clientes",
        value: data.totalClientes,
        description: "Clientes registrados",
      },
      {
        label: "Servicios",
        value: data.totalServiciosActivos,
        description: "Servicios activos",
      },
      {
        label: "Contratos",
        value: data.totalContratos,
        description: "Contratos registrados",
      },
      {
        label: "Agenda",
        value: data.totalReunionesProgramadas,
        description: "Eventos pendientes",
      },
    ];
  }, [data]);

  const maxValue = useMemo(() => {
    const values = chartData.map((item) => item.value);
    return Math.max(...values, 1);
  }, [chartData]);

  const contratosPorCliente =
    data && data.totalClientes > 0
      ? Math.round((data.totalContratos / data.totalClientes) * 100)
      : 0;

  const promedioCobrado =
    data && data.totalContratos > 0
      ? data.totalCobrado / data.totalContratos
      : 0;

  const estadoComercial =
    contratosPorCliente >= 70
      ? {
          title: "Buen avance comercial",
          message:
            "La relación entre contratos y clientes es saludable. Mantén el seguimiento para cerrar más servicios.",
          icon: CheckCircle2,
          className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        }
      : contratosPorCliente >= 40
      ? {
          title: "Avance comercial moderado",
          message:
            "Hay clientes registrados, pero aún existe oportunidad para convertir más clientes en contratos.",
          icon: ClipboardCheck,
          className: "bg-blue-50 text-blue-700 border-blue-200",
        }
      : {
          title: "Oportunidad de mejora",
          message:
            "La cantidad de contratos todavía es baja frente a los clientes registrados. Conviene reforzar seguimiento y cierre.",
          icon: AlertCircle,
          className: "bg-amber-50 text-amber-700 border-amber-200",
        };

  const EstadoIcon = estadoComercial.icon;

  return (
    <div>
      <SectionHeader
        title="Dashboard"
        subtitle="Resumen general del sistema."
      />

      {loading ? (
        <Loader />
      ) : data ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="Clientes"
              value={String(data.totalClientes)}
              icon={Users}
            />

            <StatCard
              title="Servicios activos"
              value={String(data.totalServiciosActivos)}
              icon={FileText}
            />

            <StatCard
              title="Contratos"
              value={String(data.totalContratos)}
              icon={FileText}
            />

            <StatCard
              title="Cobrado"
              value={formatCurrency(data.totalCobrado)}
              icon={Wallet}
            />

            <StatCard
              title="Agenda pendiente"
              value={String(data.totalReunionesProgramadas)}
              icon={CalendarDays}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Resumen operativo
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Comparativo general de clientes, servicios, contratos y agenda.
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <BarChart3 size={22} />
                </div>
              </div>

              <div className="space-y-4">
                {chartData.map((item) => {
                  const percentage = Math.max(
                    8,
                    Math.round((item.value / maxValue) * 100)
                  );

                  return (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {item.label}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.description}
                          </p>
                        </div>

                        <span className="text-sm font-bold text-slate-900">
                          {item.value}
                        </span>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Indicador comercial
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Porcentaje de contratos registrados respecto al total de clientes.
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <TrendingUp size={22} />
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5 text-center">
                <p className="text-sm font-medium text-slate-500">
                  Contratos por cliente
                </p>

                <p className="mt-3 text-4xl font-black text-slate-900">
                  {contratosPorCliente}%
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Mide la relación entre contratos registrados y clientes registrados.
                </p>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-xl border border-slate-200 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Promedio cobrado por contrato
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatCurrency(promedioCobrado)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Fórmula del indicador
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    Contratos ÷ Clientes × 100
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Lectura ejecutiva
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Interpretación rápida del estado actual del negocio.
                </p>
              </div>

              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${estadoComercial.className}`}
              >
                <EstadoIcon size={22} />
              </div>
            </div>

            <div
              className={`rounded-2xl border px-5 py-4 ${estadoComercial.className}`}
            >
              <h4 className="text-sm font-bold">
                {estadoComercial.title}
              </h4>
              <p className="mt-1 text-sm leading-6">
                {estadoComercial.message}
              </p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Enfoque recomendado
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  Priorizar clientes sin contrato para aumentar el cierre comercial.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Control de agenda
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  Revisar eventos pendientes para no perder reuniones, cobros o entregas.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Seguimiento financiero
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  Comparar lo cobrado contra los contratos para medir avance de pagos.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          No se pudo cargar la información del dashboard.
        </div>
      )}
    </div>
  );
}