import { useEffect, useState } from "react";
import { clientesApi, contratosApi, pagosApi } from "../api/endpoints";
import type { Cliente, Contrato, Pago } from "../types/entities";
import SectionHeader from "../components/ui/SectionHeader";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import TableWrapper from "../components/ui/TableWrapper";
import FormModal from "../components/ui/FormModal";
import { formatCurrency, formatDate } from "../utils/format";
import { useAlert } from "../context/AlertContext";

export default function PagosPage() {
  const [items,setItems]=useState<Pago[]>([]);
  const [clientes,setClientes]=useState<Cliente[]>([]);
  const [contratos,setContratos]=useState<Contrato[]>([]);
  const [loading,setLoading]=useState(true);
  const [open,setOpen]=useState(false);
  const [form,setForm]=useState({ clienteId:0, contratoId:null as number|null, monto:0, fechaPago:new Date().toISOString().slice(0,10), tipoMovimiento:"INGRESO", estadoPago:"PAGADO", metodoPago:"", observacion:"" });
  const { showAlert } = useAlert();

  const load = async()=>{ setLoading(true); try{ const [a,b,c]=await Promise.all([pagosApi.list(), clientesApi.list(), contratosApi.list()]); setItems(a.data); setClientes(b.data); setContratos(c.data);} finally{ setLoading(false);} };
  useEffect(()=>{load();},[]);

  const save = async(e:React.FormEvent)=>{ e.preventDefault(); try{ await pagosApi.create(form); showAlert("Ok","Pago o deuda registrado correctamente.","success"); setOpen(false); load(); } catch(err:any){ showAlert("Error", err?.response?.data?.message || "No se pudo registrar.", "error"); } };

  return <div><SectionHeader title="Pagos y deudas" subtitle="Controla ingresos, pagos pendientes y deudas por cliente." action={<button className="btn-primary" onClick={()=>setOpen(true)}>Nuevo movimiento</button>} />
  {loading ? <Loader /> : items.length===0 ? <EmptyState message="No hay pagos o deudas registradas." /> :
  <TableWrapper><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-slate-600"><tr><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Monto</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Método</th><th className="px-4 py-3">Fecha</th></tr></thead><tbody>{items.map(i => <tr key={i.id} className="border-t border-slate-200"><td className="px-4 py-3">{i.clienteNombre}</td><td className="px-4 py-3">{formatCurrency(i.monto)}</td><td className="px-4 py-3">{i.tipoMovimiento}</td><td className="px-4 py-3">{i.estadoPago}</td><td className="px-4 py-3">{i.metodoPago || "-"}</td><td className="px-4 py-3">{formatDate(i.fechaPago)}</td></tr>)}</tbody></table></TableWrapper>}
  <FormModal open={open} title="Nuevo pago o deuda" onClose={()=>setOpen(false)}><form onSubmit={save} className="grid gap-4 md:grid-cols-2"><select className="input" value={form.clienteId} onChange={e=>setForm({...form,clienteId:Number(e.target.value)})} required><option value={0}>Selecciona cliente</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nombres} {c.apellidos}</option>)}</select><select className="input" value={form.contratoId ?? ""} onChange={e=>setForm({...form,contratoId:e.target.value ? Number(e.target.value) : null})}><option value="">Sin contrato</option>{contratos.map(c => <option key={c.id} value={c.id}>Contrato #{c.id} - {c.clienteNombre}</option>)}</select><input className="input" type="number" step="0.01" value={form.monto} onChange={e=>setForm({...form,monto:Number(e.target.value)})} placeholder="Monto" /><input className="input" type="date" value={form.fechaPago} onChange={e=>setForm({...form,fechaPago:e.target.value})} /><select className="input" value={form.tipoMovimiento} onChange={e=>setForm({...form,tipoMovimiento:e.target.value})}><option>INGRESO</option><option>DEUDA</option></select><select className="input" value={form.estadoPago} onChange={e=>setForm({...form,estadoPago:e.target.value})}><option>PAGADO</option><option>PENDIENTE</option><option>VENCIDO</option></select><input className="input" placeholder="Método de pago" value={form.metodoPago} onChange={e=>setForm({...form,metodoPago:e.target.value})} /><input className="input" placeholder="Observación" value={form.observacion} onChange={e=>setForm({...form,observacion:e.target.value})} /><div className="md:col-span-2 flex justify-end"><button className="btn-primary" type="submit">Guardar</button></div></form></FormModal></div>;
}
