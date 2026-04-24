import { useEffect, useState } from "react";
import { usersApi } from "../api/endpoints";
import type { User } from "../types/entities";
import SectionHeader from "../components/ui/SectionHeader";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import TableWrapper from "../components/ui/TableWrapper";
import FormModal from "../components/ui/FormModal";
import { formatDate } from "../utils/format";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";

export default function UsersPage() {
  const [items,setItems]=useState<User[]>([]);
  const [loading,setLoading]=useState(true);
  const [open,setOpen]=useState(false);
  const [form,setForm]=useState({ username:"", fullName:"", password:"", roleCode:"USER" });
  const { showAlert } = useAlert();
  const { user } = useAuth();

  const load = async()=>{ setLoading(true); try{ const r=await usersApi.list(); setItems(r.data);} finally{ setLoading(false);} };
  useEffect(()=>{ if(user?.role==="ADMIN") load(); else setLoading(false); },[user]);

  const save = async(e:React.FormEvent)=>{ e.preventDefault(); try{ await usersApi.create(form); showAlert("Ok","Usuario registrado correctamente.","success"); setOpen(false); load(); } catch(err:any){ showAlert("Error", err?.response?.data?.message || "No se pudo registrar el usuario.", "error"); } };

  if (user?.role !== "ADMIN") return <EmptyState message="Solo el administrador puede ver este módulo." />;

  return <div><SectionHeader title="Usuarios" subtitle="Gestiona usuarios y perfiles del sistema." action={<button className="btn-primary" onClick={()=>setOpen(true)}>Nuevo usuario</button>} />
  {loading ? <Loader /> : items.length===0 ? <EmptyState message="No hay usuarios registrados." /> :
  <TableWrapper><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-slate-600"><tr><th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Activo</th><th className="px-4 py-3">Fecha</th></tr></thead><tbody>{items.map(i => <tr key={i.id} className="border-t border-slate-200"><td className="px-4 py-3">{i.username}</td><td className="px-4 py-3">{i.fullName}</td><td className="px-4 py-3">{i.roleCode}</td><td className="px-4 py-3">{i.isActive ? "Sí":"No"}</td><td className="px-4 py-3">{formatDate(i.fechaRegistro)}</td></tr>)}</tbody></table></TableWrapper>}
  <FormModal open={open} title="Nuevo usuario" onClose={()=>setOpen(false)}><form onSubmit={save} className="grid gap-4 md:grid-cols-2"><input className="input" placeholder="Usuario" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} required /><input className="input" placeholder="Nombre completo" value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})} required /><input className="input" type="password" placeholder="Contraseña" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required /><select className="input" value={form.roleCode} onChange={e=>setForm({...form,roleCode:e.target.value})}><option>USER</option><option>ADMIN</option></select><div className="md:col-span-2 flex justify-end"><button className="btn-primary" type="submit">Guardar</button></div></form></FormModal></div>;
}
