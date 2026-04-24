import { Menu, LogOut } from "lucide-react";
import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import { useAuth } from "../context/AuthContext";

export default function MainLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return <div className="min-h-screen bg-slate-100"><div className="flex">
    <Sidebar open={open} onClose={() => setOpen(false)} />
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur"><div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3"><button className="rounded-xl border border-slate-200 p-2 md:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button><div><p className="text-sm text-slate-500">Sistema empresarial</p><h1 className="text-lg font-bold">Gestion de Contratos</h1></div></div>
        <div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold">{user?.username}</p><p className="text-xs text-slate-500">{user?.role}</p></div><button className="btn-secondary" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Salir</button></div>
      </div></header>
      <main className="flex-1 p-4 md:p-6"><Outlet /></main>
    </div>
  </div></div>;
}
