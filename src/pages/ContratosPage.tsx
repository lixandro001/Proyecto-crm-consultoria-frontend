import { useEffect, useState } from "react";
import { clientesApi, contratosApi, plantillasApi, serviciosApi } from "../api/endpoints";
import type { Cliente, Contrato, PlantillaContrato, Servicio } from "../types/entities";
import SectionHeader from "../components/ui/SectionHeader";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import TableWrapper from "../components/ui/TableWrapper";
import FormModal from "../components/ui/FormModal";
import { formatCurrency, formatDate } from "../utils/format";
import { useAlert } from "../context/AlertContext";

export default function ContratosPage() {
  const [items,setItems]=useState<Contrato[]>([]);
  const [clientes,setClientes]=useState<Cliente[]>([]);
  const [servicios,setServicios]=useState<Servicio[]>([]);
  const [plantillas,setPlantillas]=useState<PlantillaContrato[]>([]);
  const [loading,setLoading]=useState(true);
  const [open,setOpen]=useState(false);
  const [form,setForm]=useState({ clienteId:0, servicioId:0, plantillaContratoId:null as number|null, precioTotal:0, montoPagado:0, fechaContrato:new Date().toISOString().slice(0,10), fechaEntrega:"", estadoContrato:"PENDIENTE", firmaRepresentante:"", firmaCliente:"" });
  const { showAlert } = useAlert();

  const load = async()=>{ setLoading(true); try{ const [a,b,c,d]=await Promise.all([contratosApi.list(), clientesApi.list(), serviciosApi.list(), plantillasApi.list()]); setItems(a.data); setClientes(b.data); setServicios(c.data); setPlantillas(d.data);} finally{ setLoading(false);} };
  useEffect(()=>{load();},[]);

  const save = async(e:React.FormEvent)=>{ e.preventDefault(); try{ await contratosApi.create({ ...form, fechaEntrega: form.fechaEntrega || null }); showAlert("Ok","Contrato registrado correctamente.","success"); setOpen(false); load(); } catch(err:any){ showAlert("Error", err?.response?.data?.message || "No se pudo registrar el contrato.", "error"); } };

  const downloadWord = async(id:number)=>{ try{ const response=await contratosApi.downloadWord(id); const blob = new Blob([response.data], { type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document" }); const url=window.URL.createObjectURL(blob); const link=document.createElement("a"); link.href=url; link.download=`Contrato_${id}.docx`; link.click(); window.URL.revokeObjectURL(url); showAlert("Descarga","Se descargó el Word del contrato.","success"); } catch(err:any){ showAlert("Error", err?.response?.data?.message || "No se pudo descargar el Word.", "error"); } };
  const makePdf = async(id:number)=>{ try{ await contratosApi.generarPdf(id); showAlert("PDF","Se generó el PDF del contrato.","success"); load(); } catch(err:any){ showAlert("Error", err?.response?.data?.message || "No se pudo generar el PDF.", "error"); } };

  return <div><SectionHeader title="Contratos" subtitle="Registra contratos, genera Word y PDF del servicio contratado." action={<button className="btn-primary" onClick={()=>setOpen(true)}>Nuevo contrato</button>} />
  {loading ? <Loader /> : items.length===0 ? <EmptyState message="No hay contratos registrados." /> :
  <TableWrapper><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-slate-600"><tr><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Servicio</th><th className="px-4 py-3">Precio</th><th className="px-4 py-3">Pagado</th><th className="px-4 py-3">Entrega</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Acciones</th></tr></thead><tbody>{items.map(i => <tr key={i.id} className="border-t border-slate-200 align-top"><td className="px-4 py-3 font-medium">{i.clienteNombre}</td><td className="px-4 py-3">{i.servicioNombre}</td><td className="px-4 py-3">{formatCurrency(i.precioTotal)}</td><td className="px-4 py-3">{formatCurrency(i.montoPagado)}<br /><span className="text-xs text-rose-600">Saldo: {formatCurrency(i.saldoPendiente)}</span></td><td className="px-4 py-3">{formatDate(i.fechaEntrega)}</td><td className="px-4 py-3">{i.estadoContrato}</td><td className="px-4 py-3"><div className="flex flex-wrap gap-2"><button className="btn-secondary" onClick={()=>downloadWord(i.id)}>Word</button><button className="btn-primary" onClick={()=>makePdf(i.id)}>PDF</button></div></td></tr>)}</tbody></table></TableWrapper>}
  <FormModal open={open} title="Nuevo contrato" onClose={()=>setOpen(false)}><form onSubmit={save} className="grid gap-4 md:grid-cols-2"><select className="input" value={form.clienteId} onChange={e=>setForm({...form,clienteId:Number(e.target.value)})} required><option value={0}>Selecciona cliente</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nombres} {c.apellidos}</option>)}</select><select className="input" value={form.servicioId} onChange={e=>setForm({...form,servicioId:Number(e.target.value)})} required><option value={0}>Selecciona servicio</option>{servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select><select className="input" value={form.plantillaContratoId ?? ""} onChange={e=>setForm({...form,plantillaContratoId:e.target.value ? Number(e.target.value) : null})}><option value="">Sin plantilla</option>{plantillas.map(p => <option key={p.id} value={p.id}>{p.nombrePlantilla}</option>)}</select><select className="input" value={form.estadoContrato} onChange={e=>setForm({...form,estadoContrato:e.target.value})}><option>PENDIENTE</option><option>EN_PROCESO</option><option>FINALIZADO</option><option>ANULADO</option></select><input className="input" type="number" step="0.01" placeholder="Precio total" value={form.precioTotal} onChange={e=>setForm({...form,precioTotal:Number(e.target.value)})} /><input className="input" type="number" step="0.01" placeholder="Monto pagado" value={form.montoPagado} onChange={e=>setForm({...form,montoPagado:Number(e.target.value)})} /><input className="input" type="date" value={form.fechaContrato} onChange={e=>setForm({...form,fechaContrato:e.target.value})} /><input className="input" type="date" value={form.fechaEntrega} onChange={e=>setForm({...form,fechaEntrega:e.target.value})} /><input className="input" placeholder="Firma representante" value={form.firmaRepresentante} onChange={e=>setForm({...form,firmaRepresentante:e.target.value})} /><input className="input" placeholder="Firma cliente" value={form.firmaCliente} onChange={e=>setForm({...form,firmaCliente:e.target.value})} /><div className="md:col-span-2 flex justify-end"><button className="btn-primary" type="submit">Guardar</button></div></form></FormModal></div>;
}
