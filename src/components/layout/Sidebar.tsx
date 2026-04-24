import { LayoutDashboard, Users, BriefcaseBusiness, FolderKanban, FileText, CalendarDays, Wallet, UserCog, X } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to:"/dashboard", label:"Dashboard", icon:LayoutDashboard },
  { to:"/clientes", label:"Clientes", icon:Users },
  { to:"/servicios", label:"Servicios", icon:BriefcaseBusiness },
  { to:"/cliente-servicios", label:"Cliente-Servicios", icon:FolderKanban },
  { to:"/plantillas", label:"Plantillas", icon:FileText },
  { to:"/contratos", label:"Contratos", icon:FileText },
  { to:"/agenda", label:"Agenda", icon:CalendarDays },
  { to:"/pagos", label:"Pagos y deudas", icon:Wallet },
  { to:"/usuarios", label:"Usuarios", icon:UserCog }
];

export default function Sidebar({ open, onClose }:{ open:boolean; onClose:()=>void; }) {
  return <>
    <div className={`fixed inset-0 z-30 bg-slate-900/40 md:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={onClose} />
    <aside className={`fixed left-0 top-0 z-40 flex h-screen w-72 flex-col border-r border-slate-200 bg-slate-950 text-white transition md:static md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4"><div><p className="text-xs uppercase tracking-[.2em] text-slate-400">Panel</p><h2 className="text-xl font-bold">Consultoria Ramirez</h2></div><button className="rounded-lg p-2 hover:bg-slate-800 md:hidden" onClick={onClose}><X className="h-5 w-5" /></button></div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map(item => {
          const Icon = item.icon;
          return <NavLink key={item.to} to={item.to} onClick={onClose} className={({isActive}) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${isActive ? "bg-brand-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}><Icon className="h-4 w-4" />{item.label}</NavLink>;
        })}
      </nav>
    </aside>
  </>;
}
