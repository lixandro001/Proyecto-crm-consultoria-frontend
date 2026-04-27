import { Menu, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import { useAuth } from "../context/AuthContext";

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <Sidebar
          open={mobileOpen}
          collapsed={collapsed}
          onClose={() => setMobileOpen(false)}
        />

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between px-4 py-3 md:px-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 md:hidden"
                  onClick={() => setMobileOpen(true)}
                  title="Abrir menú"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  className="hidden rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 md:inline-flex"
                  onClick={() => setCollapsed((value) => !value)}
                  title={collapsed ? "Expandir menú" : "Contraer menú"}
                >
                  {collapsed ? (
                    <PanelLeftOpen className="h-5 w-5" />
                  ) : (
                    <PanelLeftClose className="h-5 w-5" />
                  )}
                </button>

                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Sistema empresarial
                  </p>
                  <h1 className="text-base font-bold text-slate-900 md:text-lg">
                    Gestión de Contratos
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-bold text-slate-900">
                    {user?.username || "Usuario"}
                  </p>
                  <p className="text-xs font-medium uppercase text-slate-500">
                    {user?.role || "Sin rol"}
                  </p>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  onClick={logout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Salir
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}