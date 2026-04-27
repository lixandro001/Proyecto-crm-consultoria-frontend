import {
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  FolderKanban,
  FileText,
  CalendarDays,
  Wallet,
  UserCog,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/servicios", label: "Servicios", icon: BriefcaseBusiness },
  { to: "/cliente-servicios", label: "Cliente-Servicios", icon: FolderKanban },
  { to: "/plantillas", label: "Plantillas", icon: FileText },
  { to: "/contratos", label: "Contratos", icon: FileText },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/pagos", label: "Pagos y deudas", icon: Wallet },
  { to: "/usuarios", label: "Usuarios", icon: UserCog },
];

type SidebarProps = {
  open: boolean;
  collapsed?: boolean;
  onClose: () => void;
};

export default function Sidebar({
  open,
  collapsed = false,
  onClose,
}: SidebarProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/50 transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`
          fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-800 bg-slate-950 text-white shadow-2xl transition-all duration-300
          md:sticky md:top-0 md:translate-x-0 md:shadow-none
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${collapsed ? "md:w-20" : "md:w-72"}
          w-72
        `}
      >
        <div
          className={`flex min-h-[74px] items-center border-b border-slate-800 px-5 py-4 ${
            collapsed ? "md:justify-center md:px-3" : "justify-between"
          }`}
        >
          <div className={`${collapsed ? "md:hidden" : "block"}`}>
            <p className="text-xs uppercase tracking-[.2em] text-slate-400">
              Panel
            </p>
            <h2 className="text-xl font-bold leading-tight">
              Consultoria Ramirez
            </h2>
          </div>

          <div
            className={`hidden h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-sm font-black text-white shadow-lg shadow-brand-950/30 ${
              collapsed ? "md:flex" : "md:hidden"
            }`}
            title="Consultoria Ramirez"
          >
            CR
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white md:hidden"
            onClick={onClose}
            title="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `
                    group flex items-center rounded-xl py-3 text-sm font-medium transition
                    ${
                      isActive
                        ? "bg-brand-600 text-white shadow-lg shadow-brand-950/30"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }
                    ${collapsed ? "md:justify-center md:px-0" : "gap-3 px-3"}
                  `
                }
              >
                <Icon className="h-4 w-4 shrink-0" />

                <span
                  className={`truncate ${
                    collapsed ? "md:hidden" : "inline"
                  }`}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div
          className={`border-t border-slate-800 p-4 ${
            collapsed ? "md:px-3" : ""
          }`}
        >
          <div
            className={`rounded-2xl bg-white/5 p-3 ${
              collapsed ? "md:flex md:justify-center" : ""
            }`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-black text-white ${
                collapsed ? "" : "mb-2"
              }`}
            >
              CR
            </div>

            <div className={`${collapsed ? "md:hidden" : "block"}`}>
              <p className="text-xs font-bold text-white">
                Sistema empresarial
              </p>
              <p className="mt-1 text-[11px] leading-4 text-slate-400">
                Gestión de clientes, contratos, pagos y agenda.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}