import { useEffect, useState } from "react";
import { plantillasApi } from "../api/endpoints";
import type { PlantillaContrato } from "../types/entities";
import SectionHeader from "../components/ui/SectionHeader";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import TableWrapper from "../components/ui/TableWrapper";
import FormModal from "../components/ui/FormModal";
import { formatDate } from "../utils/format";
import { useAlert } from "../context/AlertContext";

export default function PlantillasPage() {
  const [items,setItems]=useState<PlantillaContrato[]>([]);
  const [loading,setLoading]=useState(true);
  const [open,setOpen]=useState(false);
  const [nombrePlantilla,setNombrePlantilla]=useState("");
  const [descripcion,setDescripcion]=useState("");
  const [archivoWord,setArchivoWord]=useState<File | null>(null);
  const { showAlert } = useAlert();

  const load = async()=>{ setLoading(true); try{ const r=await plantillasApi.list(); setItems(r.data);} finally{ setLoading(false);} };
  useEffect(()=>{load();},[]);

  const save = async(e:React.FormEvent)=>{ e.preventDefault(); if(!archivoWord){ showAlert("Error","Selecciona un archivo Word.","error"); return; } try{ const fd=new FormData(); fd.append("archivoWord", archivoWord); fd.append("nombrePlantilla", nombrePlantilla); fd.append("descripcion", descripcion); await plantillasApi.upload(fd); showAlert("Ok","Plantilla subida correctamente.","success"); setOpen(false); setNombrePlantilla(""); setDescripcion(""); setArchivoWord(null); load(); } catch(err:any){ showAlert("Error", err?.response?.data?.message || "No se pudo subir la plantilla.", "error"); } };

  return <div><SectionHeader title="Plantillas de contrato" subtitle="Sube plantillas Word para autocompletar contratos." action={<button className="btn-primary" onClick={()=>setOpen(true)}>Subir plantilla</button>} />
  {loading ? <Loader /> : items.length===0 ? <EmptyState message="No hay plantillas registradas." /> :
  <TableWrapper><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-slate-600"><tr><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Descripción</th><th className="px-4 py-3">Activa</th><th className="px-4 py-3">Fecha</th></tr></thead><tbody>{items.map(i => <tr key={i.id} className="border-t border-slate-200"><td className="px-4 py-3 font-medium">{i.nombrePlantilla}</td><td className="px-4 py-3">{i.descripcion || "-"}</td><td className="px-4 py-3">{i.activa ? "Sí" : "No"}</td><td className="px-4 py-3">{formatDate(i.fechaRegistro)}</td></tr>)}</tbody></table></TableWrapper>}
  <FormModal open={open} title="Subir plantilla Word" onClose={()=>setOpen(false)}><form onSubmit={save} className="space-y-4"><input className="input" placeholder="Nombre plantilla" value={nombrePlantilla} onChange={e=>setNombrePlantilla(e.target.value)} required /><textarea className="input" placeholder="Descripción" value={descripcion} onChange={e=>setDescripcion(e.target.value)} /><input className="input" type="file" accept=".doc,.docx" onChange={e=>setArchivoWord(e.target.files?.[0] || null)} required /><div className="flex justify-end"><button className="btn-primary" type="submit">Subir</button></div></form></FormModal></div>;
}
