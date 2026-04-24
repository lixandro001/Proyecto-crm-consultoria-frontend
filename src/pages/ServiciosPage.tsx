import { useEffect, useState } from "react";
import { serviciosApi } from "../api/endpoints";
import type { Servicio } from "../types/entities";
import SectionHeader from "../components/ui/SectionHeader";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import TableWrapper from "../components/ui/TableWrapper";
import FormModal from "../components/ui/FormModal";
import { formatCurrency } from "../utils/format";
import { useAlert } from "../context/AlertContext";

export default function ServiciosPage() {
  const [items, setItems] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ codigo:"", nombre:"", descripcion:"", precioBase:0 });
  const { showAlert } = useAlert();

  const load = async () => { setLoading(true); try { const r = await serviciosApi.list(); setItems(r.data); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const save = async (e:React.FormEvent) => {
    e.preventDefault();
    try { await serviciosApi.create(form); showAlert("Ok","Servicio registrado correctamente.","success"); setOpen(false); setForm({ codigo:"", nombre:"", descripcion:"", precioBase:0 }); load(); }
    catch (err:any) { showAlert("Error", err?.response?.data?.message || "No se pudo registrar.", "error"); }
  };

  return <div><SectionHeader title="Servicios" subtitle="Administra servicios de asesoría, compra, venta y soporte." action={<button className="btn-primary" onClick={()=>setOpen(true)}>Nuevo servicio</button>} />
  {loading ? <Loader /> : items.length===0 ? <EmptyState message="No hay servicios registrados." /> :
  <TableWrapper><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-slate-600"><tr><th className="px-4 py-3">Código</th><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Descripción</th><th className="px-4 py-3">Precio</th></tr></thead><tbody>{items.map(i => <tr key={i.id} className="border-t border-slate-200"><td className="px-4 py-3">{i.codigo}</td><td className="px-4 py-3 font-medium">{i.nombre}</td><td className="px-4 py-3">{i.descripcion || "-"}</td><td className="px-4 py-3">{formatCurrency(i.precioBase)}</td></tr>)}</tbody></table></TableWrapper>}
  <FormModal open={open} title="Nuevo servicio" onClose={()=>setOpen(false)}><form onSubmit={save} className="grid gap-4 md:grid-cols-2"><input className="input" placeholder="Código" value={form.codigo} onChange={e=>setForm({ ...form, codigo:e.target.value })} required /><input className="input" placeholder="Nombre" value={form.nombre} onChange={e=>setForm({ ...form, nombre:e.target.value })} required /><textarea className="input md:col-span-2" placeholder="Descripción" value={form.descripcion} onChange={e=>setForm({ ...form, descripcion:e.target.value })} /><input className="input" type="number" step="0.01" placeholder="Precio base" value={form.precioBase} onChange={e=>setForm({ ...form, precioBase:Number(e.target.value) })} /><div className="md:col-span-2 flex justify-end"><button className="btn-primary" type="submit">Guardar</button></div></form></FormModal></div>;
}
