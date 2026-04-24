import { useEffect, useState } from "react";
import { clienteServiciosApi, clientesApi, serviciosApi } from "../api/endpoints";
import type { Cliente, ClienteServicio, Servicio } from "../types/entities";
import SectionHeader from "../components/ui/SectionHeader";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import TableWrapper from "../components/ui/TableWrapper";
import FormModal from "../components/ui/FormModal";
import { formatDateTime } from "../utils/format";
import { useAlert } from "../context/AlertContext";

export default function ClienteServiciosPage() {
  const [items,setItems]=useState<ClienteServicio[]>([]);
  const [clientes,setClientes]=useState<Cliente[]>([]);
  const [servicios,setServicios]=useState<Servicio[]>([]);
  const [loading,setLoading]=useState(true);
  const [open,setOpen]=useState(false);
  const [form,setForm]=useState({ clienteId:0, servicioId:0, observacion:"", estadoProceso:"EN_PROCESO" });
  const { showAlert } = useAlert();

  const load = async()=>{ setLoading(true); try{ const [a,b,c]=await Promise.all([clienteServiciosApi.list(), clientesApi.list(), serviciosApi.list()]); setItems(a.data); setClientes(b.data); setServicios(c.data);} finally{ setLoading(false);} };
  useEffect(()=>{load();},[]);

  const save = async(e:React.FormEvent)=>{ e.preventDefault(); try{ await clienteServiciosApi.create(form); showAlert("Ok","Servicio asignado correctamente.","success"); setOpen(false); setForm({ clienteId:0, servicioId:0, observacion:"", estadoProceso:"EN_PROCESO" }); load(); } catch(err:any){ showAlert("Error", err?.response?.data?.message || "No se pudo guardar.", "error"); } };

  return <div><SectionHeader title="Historial cliente-servicio" subtitle="Relaciona clientes con el servicio tomado y su estado del proceso." action={<button className="btn-primary" onClick={()=>setOpen(true)}>Asignar servicio</button>} />
  {loading ? <Loader /> : items.length===0 ? <EmptyState message="No hay registros cliente-servicio." /> :
  <TableWrapper><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-slate-600"><tr><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Servicio</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Observación</th><th className="px-4 py-3">Fecha</th></tr></thead><tbody>{items.map(i => <tr key={i.id} className="border-t border-slate-200"><td className="px-4 py-3">{i.clienteNombre}</td><td className="px-4 py-3">{i.servicioNombre}</td><td className="px-4 py-3">{i.estadoProceso}</td><td className="px-4 py-3">{i.observacion || "-"}</td><td className="px-4 py-3">{formatDateTime(i.fechaAsignacion)}</td></tr>)}</tbody></table></TableWrapper>}
  <FormModal open={open} title="Asignar servicio a cliente" onClose={()=>setOpen(false)}><form onSubmit={save} className="grid gap-4 md:grid-cols-2"><select className="input" value={form.clienteId} onChange={e=>setForm({...form,clienteId:Number(e.target.value)})} required><option value={0}>Selecciona cliente</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nombres} {c.apellidos}</option>)}</select><select className="input" value={form.servicioId} onChange={e=>setForm({...form,servicioId:Number(e.target.value)})} required><option value={0}>Selecciona servicio</option>{servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select><select className="input" value={form.estadoProceso} onChange={e=>setForm({...form,estadoProceso:e.target.value})}><option>EN_PROCESO</option><option>FINALIZADO</option><option>PAUSADO</option><option>ANULADO</option></select><input className="input" placeholder="Observación" value={form.observacion} onChange={e=>setForm({...form,observacion:e.target.value})} /><div className="md:col-span-2 flex justify-end"><button className="btn-primary" type="submit">Guardar</button></div></form></FormModal></div>;
}
